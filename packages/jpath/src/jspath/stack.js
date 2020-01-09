
const data = {
    child: {
        name: 'hier1',
        child2: {
            name: 'hier2',
            child3: {
                name: 'hier3'
            }
        },
        child2sibble: [
            {
                hello:'world'
            }
        ]
    }
};

function createParent(object, prevParent) {
    return (n = 0) => {
        if (n === 0) return { d: object, p: prevParent };
        if (prevParent === undefined) return { d: object, p: prevParent }; // clamp this object as it is root
        return prevParent(n - 1);
    }
}

function init(){
   
    const p1 = createParent(data);
    const p2 = createParent(data.child, p1);
    const p3 = createParent(data.child.child2, p2);
    const p3s = createParent(data.child.child2sibble[0], p2);
    const p4 = createParent(data.child.child2.child3, p3);

    const log = p => console.log(JSON.stringify(p));
    //
    log(p4());
    log(p4(1));
    log(p4(2));
    log(p4(3));
    log(p4(4));
    //
    console.log('sibble');
    log(p3s());
    log(p3s(1));
    log(p3s(2));
    log(p3s(3));
}

init();

