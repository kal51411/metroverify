import os
import sys

# Add backend directory to sys.path so all imports work seamlessly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure VERCEL env is set so database uses /tmp
os.environ["VERCEL"] = "1"

from main import app
