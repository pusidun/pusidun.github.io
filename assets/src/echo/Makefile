BIN=echocli echoserv epollserv

all:${BIN}
%.o:%.c
	${CC} -o $@ $<

clean:
	rm ${BIN}