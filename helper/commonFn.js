const generateArray = (json, label) =>{
    let _arr= [];
    json.map(p =>{
        _arr.push(p[label])
    })
    return _arr;
}


module.exports = {
    generateArray
};