#!/usr/bin/env python3
"""
CEREBRO — Crash-Resilient Dispatcher
DAG: cerebro-worker-46c-tighten-2026-0531
Fix: Connect via ws://127.0.0.1:4223 (WebSocket, no TLS) instead of nats://4222
     Port 4222 requires mutual TLS client cert — workers don't have one.
     Port 4223 is WebSocket with no_tls:true — correct for local workers.
"""
import sys, os, subprocess, time, json, logging, asyncio
from datetime import datetime, timezone
from pathlib import Path

# ── 1. Auto-install nats-py if missing ──────────────────────────────────────
try:
    import nats
except ImportError:
    print("[CEREBRO] nats-py missing — installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "nats-py", "-q"])
    import nats

# ── 2. Inline .env loader ────────────────────────────────────────────────────
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

loaded = load_env()

# ── 3. Logging ───────────────────────────────────────────────────────────────
log_dir = Path.home() / "hive-mesh/logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CEREBRO] %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "cerebro.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("cerebro")
log.info(f"Starting v46b-fix. .env loaded from: {loaded}")

# ── 4. Routing map ────────────────────────────────────────────────────────────
ROUTES = {
    "osint":"hive.tasks.scout","recon":"hive.tasks.scout","intel":"hive.tasks.scout",
    "scan":"hive.tasks.scout","search":"hive.tasks.scout","research":"hive.tasks.scout",
    "threat":"hive.redteam.threat.inbound","breach":"hive.redteam.pentest.inbound",
    "pentest":"hive.redteam.pentest.inbound","crypto":"hive.redteam.crypto.inbound",
    "vulnerability":"hive.redteam.pentest.inbound","security":"hive.tasks.ajax",
    "infrastructure":"hive.tasks.hermes","deploy":"hive.tasks.hermes",
    "node":"hive.tasks.hermes","tunnel":"hive.tasks.hermes","devops":"hive.tasks.hermes",
    "code":"hive.tasks.forge","build":"hive.tasks.forge","script":"hive.tasks.forge",
    "grant":"hive.tasks.percy","proposal":"hive.tasks.percy",
    "revenue":"hive.tasks.halo","partnership":"hive.tasks.halo","deal":"hive.tasks.halo",
    "payment":"hive.tasks.midas","treasury":"hive.tasks.midas","wallet":"hive.tasks.midas",
    "content":"hive.tasks.miranda","editorial":"hive.tasks.miranda",
    "copy":"hive.tasks.logos","voice":"hive.tasks.logos",
    "email":"hive.comms.outgoing","comms":"hive.comms.outgoing",
    "governance":"hive.tasks.prime","policy":"hive.tasks.prime","doctrine":"hive.tasks.prime",
    "qa":"hive.qa.pending","quality":"hive.qa.pending","audit":"hive.qa.pending",
}

def route(task):
    cap = task.get("requested_capability","").lower().replace("-","_")
    text = (task.get("title","") + " " + task.get("description","")).lower()
    for kw, subj in ROUTES.items():
        if kw in cap or kw in text:
            return subj
    return "hive.tasks.worker"

# ── 5. NATS connect — WS port 4223 (no TLS) with fallback ──────────────────
async def connect_nats():
    pw_q = os.environ.get("NATS_QUEEN_PW","")
    pw_w = os.environ.get("NATS_WORKER_PW","")

    # FIX: Use WebSocket port 4223 which has no_tls:true
    # Port 4222 requires mutual TLS client cert — workers don't have one
    attempts = [
        ("queen",  pw_q, "ws://127.0.0.1:4223"),
        ("worker", pw_w, "ws://127.0.0.1:4223"),
        ("queen",  pw_q, "nats://127.0.0.1:4222"),  # fallback plain (no TLS opts)
        ("worker", pw_w, "nats://127.0.0.1:4222"),
    ]

    for user, pw, url in attempts:
        if not pw:
            continue
        try:
            opts = dict(
                user=user, password=pw,
                connect_timeout=10,
                reconnect_time_wait=3,
                max_reconnect_attempts=10,
                name="cerebro-dispatcher"
            )
            nc = await nats.connect(url, **opts)
            log.info(f"✅ NATS connected as {user} @ {url}")
            return nc
        except Exception as e:
            log.warning(f"  Connect attempt ({user} @ {url}): {e}")

    raise RuntimeError("All NATS connection attempts failed. Check NATS_QUEEN_PW/NATS_WORKER_PW in .env")

# ── 6. Main loop with crash-restart ──────────────────────────────────────────
async def run():
    dispatched = 0
    nc = await connect_nats()
    js = nc.jetstream()

    async def emit_event(event_type, data):
        try:
            event = json.dumps({
                "type": event_type,
                "agent": "cerebro",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **data
            }).encode()
            await nc.publish("hive.audit.cerebro", event)
        except Exception:
            pass

    async def handler(msg):
        nonlocal dispatched
        # Skip Sue's exec/result subjects - not routable tasks
        # Belt-and-suspenders: skip any exec/result subjects that slip through
        if 'sue.exec' in msg.subject or msg.subject.startswith('hive.results') or msg.subject.startswith('hive.tasks.sue'):
            try: await msg.ack()
            except: pass
            return
        try:
            task = json.loads(msg.data.decode())
            target = route(task)
            task_id = task.get("task_id","?")
            if target != msg.subject:
                routed = {**task, "cerebro_routed": True, "cerebro_target": target,
                          "routed_at": datetime.now(timezone.utc).isoformat()}
                await nc.publish(target, json.dumps(routed).encode())
                dispatched += 1
                log.info(f"[{dispatched}] {task_id[:12]} {msg.subject} → {target}")
                await emit_event("task_dispatched", {
                    "task_id": task_id,
                    "from_subject": msg.subject,
                    "to_subject": target,
                    "capability": task.get("requested_capability", ""),
                    "title": task.get("title", "")
                })
            await msg.ack()
        except Exception as e:
            log.error(f"Handler error: {e}")
            try: await msg.nak()
            except: pass

    # Tightened subject — cerebro only handles tasks explicitly dispatched
    # to hive.tasks.board.* — no longer wildcard-catching hive.tasks.sue.exec or other workers
    sub = await js.subscribe("hive.tasks.board.*", durable="cerebro", manual_ack=True, cb=handler)
    log.info("CEREBRO LIVE — routing hive.tasks.board.* (tightened v46c) ...")

    while True:
        await asyncio.sleep(30)
        log.info(f"CEREBRO alive | dispatched={dispatched}")

def main():
    retry = 0
    while True:
        try:
            asyncio.run(run())
        except Exception as e:
            retry += 1
            wait = min(60, 5 * retry)
            log.error(f"CRASH #{retry}: {e} — restarting in {wait}s")
            time.sleep(wait)

if __name__ == "__main__":
    main()

