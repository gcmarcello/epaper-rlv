FROM minio/minio:latest

EXPOSE 9000
EXPOSE 9001

CMD ["minio", "server", "/data", "--address", ":9000", "--console-address", ":9001"]
