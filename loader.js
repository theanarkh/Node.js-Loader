const fs = require('fs');
const { relative } = require('path');

function load() {
    return new Promise((resolve, reject) => {
        const root = process.cwd() + '/a';
        const fileTree = {};
        const REGEXP = /\.(js|json|node)$/;
        const filters = ['node_modules', '__tests__'];
        let request = 0;
        let done = false;
        function _load(currentPath) {
            request++;
            fs.readdir(currentPath, (error, dirOrFiles) => {
                request--;
                if (error) {
                    console.error(error);
                    !done && reject(e);
                } else if (dirOrFiles.length) {
                    const absolutePaths = dirOrFiles.filter( (file) => !filters.includes(file) ).map((file) => `${currentPath}/${file}`);
                    for (let i = 0; i < absolutePaths.length; i++) {
                        const absolutePath = absolutePaths[i];
                        request++;
                        fs.stat(absolutePath, (error, stat) => {
                            request--;
                            if (error) {
                                console.error(error);
                                !done && reject(e);
                            } else {
                                if (stat.isDirectory()) {
                                    _load(absolutePath);
                                } else {
                                    try {
                                        if (!REGEXP.test(absolutePath)) {
                                            return;
                                        }
                                        const absolutePathWhithoutExt = absolutePath.replace(REGEXP, '');
                                        const relativePathWhithoutExt = relative(root, absolutePathWhithoutExt);
                                        const paths = relativePathWhithoutExt.split('/');
                                        let currentNode = fileTree;
                                        for (let j = 0; j < paths.length - 1; j++) {
                                            const path = paths[j];
                                            if (typeof currentNode[path] === 'object' && currentNode[path] !== null) {
                                                currentNode = currentNode[path];
                                            } else {
                                                currentNode = currentNode[path] = {};
                                            }
                                        }
                                        currentNode[paths[paths.length - 1]] = require(absolutePath);
                                        
                                    } catch(e) {
                                        console.error(e);
                                        !done && reject(e);
                                    }
                                }
                            }
                            if (!request && !done) {
                                resolve(fileTree);
                            }
                        });
                    }
                }
                if (!request && !done) {
                    resolve(fileTree);
                }
            });
        }
        _load(root);
    });
}

load().then(console.log).catch(console.error);