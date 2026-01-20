/**
 * Created by sbernstein on 4/8/15.
 */
function parseAndGenerate(){
    var text = document.getElementById('input').value;

    var parser = new DOMParser();
    var pomXml = parser.parseFromString(text, 'text/xml');

    var propertyList = [];
    var dependencies = getDependencies(text, parser, pomXml, propertyList);
    var properties = getProperties(text, parser, pomXml, propertyList);

    return properties + dependencies;
}

function getProperties(text, parser, pomXml, propertyList){
    var shouldAddOuterClosure =  pomXml.getElementsByTagName('properties').length;
    if(!shouldAddOuterClosure){
        text = '<root>' + text + '</root>';
        pomXml = parser.parseFromString(text, 'text/xml');
    }

    var propertyElements = pomXml.getElementsByTagName("properties");
    var output = "";
    if(propertyElements != null && propertyElements.length > 0) {
        var propertyNodeList = propertyElements[0].childNodes;

        for(var i = 0; i < propertyNodeList.length; i++) {
            var propertyNode = propertyNodeList[i];
            if(propertyNode.namespaceURI == "http://maven.apache.org/POM/4.0.0") {
                var propertyName = camelCase(propertyNode.tagName);
                var propertyValue = propertyNode.textContent;
                if(propertyList.indexOf(propertyName) != -1) {
                    output += "def " + propertyName + " = \"" + propertyValue + "\"\n"
                }
            }
        }
    }

    return output;
}

function camelCase(input) {
    return input.toLowerCase().replace(/[.-](.)/g, function(match, group1) {
        return group1.toUpperCase();
    });
}

function getDependencies(text, parser, pomXml, propertyList){
    var shouldAddOuterClosure =  pomXml.getElementsByTagName('dependencies').length;
    if(!shouldAddOuterClosure){
        text = '<root>' + text + '</root>';
        pomXml = parser.parseFromString(text, 'text/xml');
    }
    var depElems = pomXml.getElementsByTagName('dependency');
    var grDeps = [];
    for(var i = 0; i < depElems.length; i++) {
        var depElem = depElems[i];
        var scopeElems = depElem.getElementsByTagName('scope');
        var scope = 'implementation';
        if (scopeElems.length && scopeElems[0].innerHTML == 'test') {
            scope = 'testImplementation';
        }
        var group = depElem.getElementsByTagName('groupId')[0].innerHTML;
        var artifact = depElem.getElementsByTagName('artifactId')[0].innerHTML;
        var versionElems = depElem.getElementsByTagName('version');
        var version = '*';
        if (versionElems.length) {
            version = versionElems[0].innerHTML;
        }
        if(version.startsWith("$")) {
            version = camelCase(version);
            if(propertyList.indexOf(version) == -1) {
                propertyList.push(version.substring(2, version.length - 1))
            }
        }
        grDeps.push(scope + ' ' + '"' + group + ":" + artifact + ":" + version + '"');
    }
    var grDepsOutput = grDeps.join('\n');
    if(shouldAddOuterClosure){
        grDepsOutput = 'dependencies {\n\t' + grDepsOutput.replace(/\n/g, '\n\t') + '\n}'
    }
    return grDepsOutput;
}

function convert(){
    var ok = document.getElementById('success');
    var empty = document.getElementById('empty');
    var fail = document.getElementById('failed');
    ok.hidden = true;
    empty.hidden = true;
    fail.hidden = true;
    var output = document.getElementById('output');
    try {
        output.value = parseAndGenerate();
        if(output.value){
            ok.hidden = false;
            output.select();
        } else {
            empty.hidden = false;
        }
    }
    catch (err){
        output.value = '';
        fail.hidden = false;
        console.log(err)
    }

}
