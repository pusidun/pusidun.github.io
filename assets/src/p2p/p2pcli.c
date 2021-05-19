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
    exit(0);
}

int main(){
    int clt_fd;
    struct sockaddr_in serv_addr;

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(8080);
    if(inet_aton("127.0.0.1", &serv_addr.sin_addr) == 0){
        perror("inet_aton");
        exit(-1);
    }
    
    clt_fd = socket(AF_INET, SOCK_STREAM, 0);
    if(clt_fd < 0){
        perror("socket");
        exit(-1);
    }

    signal(SIGUSR1, handle);

    char addr_dst[32];
    char buff[1024];
    if(connect(clt_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) == -1){
        perror("connect");
        exit(-1);
    }
    printf("Connect successfully\t%s at PORT %d\n",inet_ntop(AF_INET,&serv_addr.sin_addr,addr_dst,sizeof(addr_dst)),ntohs(serv_addr.sin_port));
    pid_t pid = fork();
    //parent.send msg
    if(pid > 0){
        printf("Please input the alphabet:");
        while(fgets(buff, sizeof(buff), stdin)){
            write(clt_fd, buff, strlen(buff));
            memset(buff, 0, sizeof(buff));
            printf("Please input the alphabet:");
        }
    }
    //child.recv msg.
    else if(pid == 0) {
        while(1) {
            int ret = read(clt_fd, buff, sizeof(buff));
            if(ret == 0){
                printf("server close\n");
                break;
            }
            else if(ret < 0){
                perror("read");
                exit(-1);
            }
            fputs(buff,stdout);
            memset(buff, 0, sizeof(buff));
        }
        close(clt_fd);
        kill(getppid(), SIGUSR1);
    }
    else if(pid == -1){
        perror("fork");
        close(clt_fd);
        exit(-1);
    }
    return 0;
}