function extendObj(source, target) {
    for(let key in target) {
        source[key] = target[key];
    }

    return source;
}

function booleanToNumber (origin) {
    return origin ? 1 : 0;
}

module.exports = {
    extendObj: extendObj,
    booleanToNumber: booleanToNumber
};