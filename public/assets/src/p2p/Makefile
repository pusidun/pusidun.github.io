BINARYS=p2pcli p2psvr

all:${BINARYS}

p2pcli:p2pcli.o
	${CC} -o $@ $^

p2psvr:p2psvr.o
	${CC} -o $@ $^

.PHONY:clean

clean:
	rm *.o ${BINARYS}