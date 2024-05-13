cd network

./network.sh down

docker volume ls --format '{{.Name}}' | grep '\.com' | awk '{print $1}' | xargs docker volume rm