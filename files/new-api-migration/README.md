# new-api PostgreSQL 覆盖迁移

目标：把 NAS 上的 `new-api` PostgreSQL 数据迁移到美国服务器，并以 NAS 数据为准覆盖美国服务器现有数据库。

当前环境：

```text
美国服务器 IP：170.106.179.185
美国服务器部署目录：/opt/new-api
美国服务器 dump 文件位置：/home/ubuntu/new-api.dump

PostgreSQL 容器名：postgres
数据库名：new-api
数据库用户：root
数据库密码：123456
```

这是覆盖迁移，不是合并迁移。美国服务器当前数据库会被删除重建。脚本会先自动备份美国服务器现有库。

## 1. 在 NAS 导出数据库

在 NAS 上确认 PostgreSQL 容器：

```bash
docker ps
```

你当前 NAS 的数据库信息是：

```text
容器名：postgres
POSTGRES_DB=new-api
POSTGRES_USER=root
POSTGRES_PASSWORD=123456
```

在 NAS 上执行导出：

```bash
cd /vol1/1000/docker_data/new-api
docker exec -e PGPASSWORD='123456' -t postgres pg_dump -U root -d new-api -Fc > new-api.dump
ls -lh new-api.dump
```

正常会看到类似：

```text
-rw-rw---- 1 root root 1.9M ... new-api.dump
```

## 2. 从 NAS 传到美国服务器

因为 `/opt/new-api` 通常需要 root 权限，先传到美国服务器的 `ubuntu` 用户家目录：

```bash
scp new-api.dump ubuntu@170.106.179.185:/home/ubuntu/new-api.dump
```

如果首次连接提示：

```text
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

输入：

```text
yes
```

然后输入美国服务器 `ubuntu` 用户密码。

登录美国服务器确认文件：

```bash
ssh ubuntu@170.106.179.185
ls -lh /home/ubuntu/new-api.dump
```

如果你已经切到 root，也可以这样确认：

```bash
ls -lh /home/ubuntu/new-api.dump
```

## 3. 准备恢复脚本

把 `restore-new-api-postgres.sh` 放到美国服务器，例如：

```text
/opt/new-api/restore-new-api-postgres.sh
```

赋予执行权限：

```bash
chmod +x /opt/new-api/restore-new-api-postgres.sh
```

脚本默认使用：

```text
PROJECT_DIR=/opt/new-api
DUMP_FILE=/home/ubuntu/new-api.dump
POSTGRES_CONTAINER=postgres
APP_SERVICE=new-api
DB_NAME=new-api
DB_USER=root
DB_PASSWORD=123456
```

如果这些值和实际环境不同，可以执行时用环境变量覆盖。

## 4. 在美国服务器覆盖恢复

在美国服务器执行：

```bash
cd /opt/new-api
./restore-new-api-postgres.sh
```

脚本会显示即将操作的目录、dump 文件、数据库和容器名，并提示：

```text
Type OVERWRITE to continue:
```

确认要覆盖美国服务器数据库时，输入：

```text
OVERWRITE
```

脚本会依次执行：

```text
1. 检查 /home/ubuntu/new-api.dump 是否存在
2. 停止 new-api 应用容器
3. 备份美国服务器当前数据库
4. 断开 new-api 数据库现有连接
5. 删除并重建 new-api 数据库
6. 导入 NAS dump
7. 启动 docker compose 服务
8. 打印恢复后的表列表
```

备份文件会放在：

```text
/opt/new-api/new-api-us-before-overwrite-YYYYMMDD-HHMMSS.dump
```

## 5. 手动恢复命令

如果不用脚本，可以在美国服务器手动执行。

进入目录：

```bash
cd /opt/new-api
```

备份美国服务器当前库：

```bash
docker exec -e PGPASSWORD='123456' -t postgres pg_dump -U root -d new-api -Fc > new-api-us-before-overwrite.dump
```

停止应用：

```bash
docker compose stop new-api
```

删除并重建数据库：

```bash
docker exec -e PGPASSWORD='123456' -i postgres psql -v ON_ERROR_STOP=1 -U root -d postgres <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'new-api' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "new-api";
CREATE DATABASE "new-api" OWNER root;
SQL
```

导入 NAS dump：

```bash
docker exec -e PGPASSWORD='123456' -i postgres pg_restore -U root -d new-api --no-owner --role=root < /home/ubuntu/new-api.dump
```

启动服务：

```bash
docker compose up -d
```

## 6. 验证

查看容器状态：

```bash
cd /opt/new-api
docker compose ps
```

查看应用日志：

```bash
docker compose logs -f new-api
```

查看数据库表：

```bash
docker exec -e PGPASSWORD='123456' -it postgres psql -U root -d new-api -c "\dt"
```

浏览器访问：

```text
http://170.106.179.185:3000
```

## 7. 注意事项

如果 `new-api` 使用了 `CRYPTO_SECRET`，美国服务器的 `CRYPTO_SECRET` 最好和 NAS 原环境保持一致。否则旧数据中被加密的配置可能无法解密。

如果脚本报：

```text
ERROR: dump file does not exist
```

检查文件是否在：

```bash
ls -lh /home/ubuntu/new-api.dump
```

如果应用服务名不是 `new-api`，查看实际服务名：

```bash
cd /opt/new-api
docker compose ps
```

然后执行时覆盖：

```bash
APP_SERVICE=实际服务名 ./restore-new-api-postgres.sh
```
