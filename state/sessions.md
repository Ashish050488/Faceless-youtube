# Live sessions (update when one is replaced)
- Dispatcher (runs the whole schedule from scheduled tasks): session_01L2u12FKT36THmLeigSYcjZ
  - Mon–Sat 00:17 UTC → Short 1 job · Mon–Sat 05:17 UTC → Short 2 job · Sun 02:17 UTC → long-video job
- Each job = a NEW script session (started by the dispatcher). The script session starts its OWN fresh video-builder
  session with create_session, with the full build order in the first prompt. There is NO fixed video-builder chat:
  orders sent to an existing chat get refused (23 Nov: Short 2 was lost this way).
- Instagram: session_01L2u12DRCGMHdb1CMdfRUan
