#!/usr/bin/env python3
"""
REDTEAM — Crash-Resilient Security Audit Worker
DAG: redteam-worker-rebuild-2026-0530
Rebuilt from scratch (original file was 0 bytes). Models the proven
scout_worker.py structure with correct cb=handler JetStream subscribe.
"""
import sys, os, subprocess, time, json, logging, asyncio
from datetime import datetime, timezone
from pathlib import Path

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
    format="%(asctime)s [REDTEAM] %(levelname)s %(message)s",
    handlers=[logging.FileHandler(log_dir/"redteam.log"), logging.StreamHandler()]
)
log = logging.getLogger("redteam")

def audit_check(check, args):
    """Run a security audit check. Returns finding dict."""
    result = {"check": check, "status": "unknown", "output": "", "severity": "info"}
    try:
        if check == "open_ports":
            r = subprocess.run("ss -tulnp 2>/dev/null | grep LISTEN || netstat -tulnp 2>/dev/null | grep LISTEN",
                               shell=True, capture_output=True, text=True, timeout=15)
            result["output"] = r.stdout[:2000]
            result["status"] = "success"
            # Flag suspicious high ports
            if "37379" in r.stdout:
                result["severity"] = "high"
                result["output"] += "\n⚠️ Port 37379 detected (known UPnP risk)"
        elif check == "docker_socket":
            r = subprocess.run("ls -la /var/run/docker.sock 2>/dev/null; groups | tr ' ' '\\n' | grep -c docker",
                               shell=True, capture_output=True, text=True, timeout=10)
            result["output"] = r.stdout[:1000]
            result["status"] = "success"
            if "docker" in r.stdout and "srw" in r.stdout:
                result["severity"] = "medium"
        elif check == "unsafe_flags":
            r = subprocess.run("grep -rH 'ALLOW_UNSAFE\\|UNSAFE_PUBLIC' /home/user/*/.env /home/user/.env 2>/dev/null | grep '=1' || echo 'no unsafe flags set to 1'",
                               shell=True, capture_output=True, text=True, timeout=10)
            result["output"] = r.stdout[:1000]
            result["status"] = "success"
            if "=1" in r.stdout:
                result["severity"] = "high"
        elif check == "world_writable":
            r = subprocess.run("find /home/user/hive-mesh -maxdepth 2 -perm -002 -type f 2>/dev/null | head -10 || echo none",
                               shell=True, capture_output=True, text=True, timeout=15)
            result["output"] = r.stdout[:1000]
            result["status"] = "success"
        else:
            result["output"] = f"unknown check: {check}"
            result["status"] = "skipped"
    except subprocess.TimeoutExpired:
        result["output"] = "timeout"; result["status"] = "timeout"
    except Exception as e:
        result["output"] = str(e); result["status"] = "error"
    return result

async def connect_nats():
    for user, pw_key, use_tls in [
        ("queen","NATS_QUEEN_PW",True), ("worker","NATS_WORKER_PW",True),
        ("queen","NATS_QUEEN_PW",False), ("worker","NATS_WORKER_PW",False)]:
        pw = os.environ.get(pw_key,"")
        if not pw: continue
        try:
            opts = dict(user=user, password=pw, connect_timeout=10,
                       reconnect_time_wait=3, max_reconnect_attempts=10, name="redteam-audit")
            if use_tls:
                import ssl
                ctx = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
                ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
                ca = Path.home()/"hive-mesh/config/certs/ca.crt"
                if ca.exists(): ctx.load_verify_locations(str(ca))
                opts["tls"] = ctx
            nc = await nats.connect("ws://127.0.0.1:4223", **opts)
            log.info(f"✅ NATS connected as {user} TLS={use_tls}")
            return nc
        except Exception as e:
            log.warning(f"  ({user}, TLS={use_tls}): {e}")
    raise RuntimeError("All NATS connection attempts failed")

async def run():
    completed = 0
    nc = await connect_nats()
    js = nc.jetstream()

    async def emit_event(event_type, data):
        try:
            await nc.publish("hive.audit.redteam", json.dumps({
                "type": event_type, "agent": "redteam",
                "timestamp": datetime.now(timezone.utc).isoformat(), **data
            }).encode())
        except Exception:
            pass

    async def handler(msg):
        nonlocal completed
        try:
            task = json.loads(msg.data.decode())
            task_id = task.get("task_id","?")
            title = task.get("title","?")[:60]
            log.info(f"REDTEAM task: {task_id[:12]} | {title}")
            text = (task.get("title","")+" "+task.get("description","")).lower()
            target = task.get("inputs",{}).get("target","")

            checks = []
            if any(w in text for w in ["port","network","listen"]): checks.append(("open_ports",[target]))
            if any(w in text for w in ["docker","socket","container"]): checks.append(("docker_socket",[]))
            if any(w in text for w in ["unsafe","flag","env","config"]): checks.append(("unsafe_flags",[]))
            if any(w in text for w in ["writable","permission","file"]): checks.append(("world_writable",[]))
            if not checks:
                # Default full audit sweep
                checks = [("open_ports",[]),("docker_socket",[]),("unsafe_flags",[]),("world_writable",[])]

            findings = [audit_check(c, a) for c, a in checks]
            high = [f for f in findings if f.get("severity") == "high"]
            report = {"task_id":task_id,"title":title,"findings":findings,
                      "checks_run":[f["check"] for f in findings],
                      "high_severity_count":len(high),
                      "completed_at":datetime.now(timezone.utc).isoformat(),"status":"complete"}
            await nc.publish("hive.results.redteam", json.dumps(report).encode())
            await emit_event("audit_complete", {
                "task_id": task_id, "title": title,
                "checks": [f["check"] for f in findings],
                "high_severity": len(high), "status": "complete"
            })
            completed += 1
            log.info(f"REDTEAM complete [{completed}]: {task_id[:12]} | high={len(high)}")
            await msg.ack()
        except Exception as e:
            log.error(f"Handler: {e}")
            try: await msg.nak()
            except: pass

    sub = await js.subscribe("hive.redteam.>", durable="redteam-active", manual_ack=True, cb=handler)
    log.info("REDTEAM LIVE — waiting for audit tasks...")
    while True:
        await asyncio.sleep(60)

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
