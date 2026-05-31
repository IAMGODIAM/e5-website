#!/usr/bin/env python3
"""
SUE SHELL EXEC — Direct command execution via NATS
DAG: exec-worker-2026-0529
Listens on hive.tasks.sue.exec, runs shell commands, replies with output.
"""
import sys, os, subprocess, time, json, logging, asyncio
from pathlib import Path
from datetime import datetime, timezone

try:
    import nats
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "nats-py", "-q"])
    import nats

def load_env():
    for path in [Path.home()/"hive-mesh/.env", Path(".env")]:
        if path.exists():
            for line in path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())
            return str(path)
    return None

load_env()

log_dir = Path.home()/"hive-mesh/logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [EXEC-WORKER] %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(log_dir/"sue_exec.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("sue-exec")

async def connect_nats():
    import ssl as ssl_mod
    ctx = ssl_mod.create_default_context(ssl_mod.Purpose.SERVER_AUTH)
    ca = os.path.expanduser("~/hive-mesh/config/certs/ca.crt")
    if os.path.exists(ca):
        ctx.load_verify_locations(ca)
        ctx.load_cert_chain(
            os.path.expanduser("~/hive-mesh/config/certs/client.crt"),
            os.path.expanduser("~/hive-mesh/config/certs/client.key"))
    ctx.check_hostname = False
    for user, pw_key in [
        ("sue","NATS_SUE_PW"),
        ("queen","NATS_QUEEN_PW"),
        ("worker","NATS_WORKER_PW"),
    ]:
        pw = os.environ.get(pw_key,"")
        if not pw: continue
        try:
            nc = await nats.connect(
                "nats://127.0.0.1:4222",
                tls=ctx,
                user=user, password=pw,
                connect_timeout=10,
                reconnect_time_wait=3,
                max_reconnect_attempts=20,
                name="exec-worker"
            )
            log.info(f"✅ Connected as {user}")
            return nc
        except Exception as e:
            log.warning(f"  ({user}): {e}")
    raise RuntimeError("All NATS connection attempts failed")

async def run():
    executed = 0
    nc = await connect_nats()

    async def handler(msg):
        nonlocal executed
        try:
            task = json.loads(msg.data.decode())
            task_id = task.get("task_id", "?")
            command = task.get("command", "")
            reply_to = task.get("reply_to", "hive.results.sue")

            if not command:
                log.warning(f"No command in task {task_id}")
                return

            log.info(f"EXEC [{task_id}]: {command[:80]}")

            result = subprocess.run(
                command, shell=True,
                capture_output=True, text=True, timeout=120
            )

            response = {
                "task_id": task_id,
                "status": "success" if result.returncode == 0 else "error",
                "returncode": result.returncode,
                "stdout": result.stdout[:4000],
                "stderr": result.stderr[:1000],
                "command": command[:200],
                "executed_at": datetime.now(timezone.utc).isoformat(),
                "executor": "exec-worker"
            }

            await nc.publish(reply_to, json.dumps(response).encode())
            executed += 1
            log.info(f"  ✅ Done [{executed}] rc={result.returncode} → {reply_to}")

        except subprocess.TimeoutExpired:
            err = {"task_id": task.get("task_id","?"), "status":"timeout", "error":"Command exceeded 120s"}
            await nc.publish(task.get("reply_to","hive.results.sue"), json.dumps(err).encode())
        except Exception as e:
            log.error(f"Handler error: {e}")

    sub = await nc.subscribe("hive.tasks.sue.exec", cb=handler)
    log.info("EXEC-WORKER LIVE — listening on hive.tasks.sue.exec")

    while True:
        await asyncio.sleep(30)
        log.info(f"Alive | executed={executed}")

def main():
    retry = 0
    while True:
        try:
            asyncio.run(run())
        except Exception as e:
            retry += 1
            wait = min(60, 5*retry)
            log.error(f"CRASH #{retry}: {e} — restart in {wait}s")
            time.sleep(wait)

if __name__ == "__main__":
    main()
