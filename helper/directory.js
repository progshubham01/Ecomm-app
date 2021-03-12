var fs = require('fs');

module.exports = {
    save_directory: async function (uploadDir)
    {
        if (!fs.existsSync(uploadDir)) {
            await fs.mkdirSync(uploadDir, {recursive: true});
            return true;
        }    
    }
};