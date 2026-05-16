all:readn writen

readn:readn.c
	${CC} -o $@ $^

writen:writen.c
	${CC} -o $@ $^

.PHONY: clean

clean:
	rm readn writen readn.o writen.o