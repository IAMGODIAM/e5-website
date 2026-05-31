#!/usr/bin/env python3
"""
SCOUT — Crash-Resilient Intel Worker v2
DAG: scout-worker-46a-v2-2026-0529
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
    format="%(asctime)s [SCOUT] %(levelname)s %(message)s",
    handlers=[logging.FileHandler(log_dir/"scout.log"), logging.StreamHandler()]
)
log = logging.getLogger("scout")

def run_tool(tool, args):
    result = {"tool": tool, "status": "unknown", "output": ""}
    if tool == "web_search":
        import urllib.request, urllib.parse
        q = urllib.parse.quote_plus(" ".join(str(a) for a in args))
        try:
            resp = urllib.request.urlopen(
                f"https://api.duckduckgo.com/?q={q}&format=json&no_html=1", timeout=10)
            data = json.loads(resp.read())
            abstract = data.get("AbstractText","")
            related = [r.get("Text","") for r in data.get("RelatedTopics",[])[:3]]
            result["output"] = abstract or " | ".join(related) or "No direct answer"
            result["status"] = "success"
        except Exception as e:
            result["output"] = str(e); result["status"] = "error"
        return result
    try:
        r = subprocess.run([tool]+[str(a) for a in args if a],
                           capture_output=True, text=True, timeout=30)
        result["output"] = (r.stdout or r.stderr)[:2000]
        result["status"] = "success" if r.returncode == 0 else "partial"
    except FileNotFoundError:
        result["output"] = f"{tool} not installed"; result["status"] = "not_found"
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
                       reconnect_time_wait=3, max_reconnect_attempts=10, name="scout-intel")
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
        """Emit audit event to HIVE_AUDIT stream (fire-and-forget)."""
        try:
            await nc.publish("hive.audit.scout", json.dumps({
                "type": event_type, "agent": "scout",
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
            log.info(f"SCOUT task: {task_id[:12]} | {title}")
            text = (task.get("title","")+" "+task.get("description","")).lower()
            target = task.get("inputs",{}).get("target","")
            tools = []
            if any(w in text for w in ["username","sherlock","social"]): tools.append(("sherlock",[target]))
            if any(w in text for w in ["subdomain","dns","subfinder"]): tools.append(("subfinder",["-d",target]))
            if any(w in text for w in ["port","nmap","network"]): tools.append(("nmap",["-sV",target]))
            if not tools: tools.append(("web_search",[title]))
            findings = [run_tool(t, a) for t,a in tools]
            report = {"task_id":task_id,"title":title,"findings":findings,
                      "tools_run":[f["tool"] for f in findings],
                      "completed_at":datetime.now(timezone.utc).isoformat(),"status":"complete"}
            await nc.publish("hive.results.scout", json.dumps(report).encode())
            await nc.publish("hive.events.intel", json.dumps(
                {"type":"scout_complete","task_id":task_id,"ts":report["completed_at"]}).encode())
            # Phase 47: audit event
            await emit_event("intel_gathered", {
                "task_id": task_id, "title": title,
                "tools": [f["tool"] for f in findings],
                "status": "complete"
            })
            completed += 1
            log.info(f"SCOUT complete [{completed}]: {task_id[:12]}")
            await msg.ack()
        except Exception as e:
            log.error(f"Handler: {e}")
            try: await msg.nak()
            except: pass

    sub = await js.subscribe("hive.tasks.scout", durable="scout-worker", manual_ack=True, cb=handler)
    log.info("SCOUT LIVE — waiting for intel tasks...")
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
