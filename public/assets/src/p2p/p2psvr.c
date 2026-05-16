#include<sys/types.h>
#include<sys/socket.h>
#include<arpa/inet.h>
#include<stdio.h>
#include<signal.h>
#include<unistd.h>
#include<stdlib.h>
#include<string.h>

void handle(int sig){
    printf("recv sig: %d\n", sig);
    exit(-1);
}

int main(){
    signal(SIGUSR1, handle);
    
    int serv_fd = socket(AF_INET, SOCK_STREAM, 0);
    if(serv_fd == -1){
        perror("socket");
        exit(-1);
    }

    int opt_val;
    if(setsockopt(serv_fd,SOL_SOCKET,SO_REUSEADDR,&opt_val, sizeof(opt_val)) == -1){
        perror("setsockopt");
        exit(-1);
    }
    struct sockaddr_in serv_addr;
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(8080);
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);

    if(bind(serv_fd,(struct sockaddr*)&serv_addr,sizeof(serv_addr)) == -1){
        perror("bind");
        exit(-1);
    }

    if(listen(serv_fd,5) == -1){
        perror("listen");
        exit(-1);
    }

    int conn_fd,clt_len;
    struct sockaddr_in clt_addr;
    char dst[32],buff[1024];
    if( -1 == (conn_fd = accept(serv_fd,(struct sockaddr*)&clt_addr, &clt_len))){
        perror("accept");
        exit(-1);
    }

    printf("recv from %s at PORT %d", inet_ntop(AF_INET, &clt_addr, dst, sizeof(dst)), ntohs(clt_addr.sin_port));

    pid_t pid = fork();

    if(pid > 0){
        while(1){
            int ret = read(conn_fd, buff, sizeof(buff));
            if(ret == 0){
                printf("client close\n");
                break;
            }
            else if(ret < 0){
                perror("read");
                exit(-1);
            }
            fputs(buff, stdout);
            memset(buff, 0, sizeof(buff));
        }
        close(conn_fd);
        close(serv_fd);
        kill(pid, SIGUSR1);
    }
    else if(pid == 0){
        printf("Please input alphabet:");
        while(fgets(buff, sizeof(buff), stdin)){
            write(conn_fd, buff, sizeof(buff));
            memset(buff, 0, sizeof(buff));
            printf("Please input alphabet:");
        }
    }
    else if(pid == -1){
        perror("fork");
        close(conn_fd);
        close(serv_fd);
        exit(-1);
    }
    return 0;
}