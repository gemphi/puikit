# Phiora (Python) — the FastAPI data backend. Build from puikit/apps:
#   docker build -f phiora-py/Dockerfile -t phiora-py ./phiora-py
FROM python:3.12-slim
WORKDIR /srv/phiora-py
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
ENV PORT=4400
EXPOSE 4400
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:4400/health')" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4400"]
