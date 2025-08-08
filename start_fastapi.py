#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to server directory
os.chdir('server')

# Run FastAPI server
subprocess.run([sys.executable, 'fastapi_proxy.py'])