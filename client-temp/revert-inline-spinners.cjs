const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.jsx')) results.push(file);
    });
    return results;
}
const files = walk('C:/Users/jyoti/Desktop/AG/college-erp/client-temp/src');
let fixed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('<PacmanLoader color="#3ecec9" size={10} />')) {
        let newContent = content.replace(/<PacmanLoader color="#3ecec9" size={10} \/>/g, '<span className="spinner" />');
        fs.writeFileSync(file, newContent);
        console.log('Reverted inline spinner in', file);
        fixed++;
    }
});
console.log('Total fixed:', fixed);
