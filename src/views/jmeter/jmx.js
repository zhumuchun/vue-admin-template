function xml2json(object, nodes) {
  if (object instanceof Array) {
    nodes.forEach(node => {
      if (node.nodeName === 'hashTree') {
        object.at(-1)['hashTree'] = []
        xml2json(object.at(-1)['hashTree'], node.children)
      } else {
        object.push({
          attributes: node.getAttributeNames().reduce((attributes, name) => {
            attributes[name] = node.getAttribute(name)
            return attributes
          }, {})
        })
        xml2json(object.at(-1), node.children)
      }
    })
  } else {
    nodes.forEach(node => {
      let name = node.getAttribute('name')
      switch (node.nodeName) {
        case 'intProp' :
        case 'longProp':
          object[name] = node.hasChildNodes() ? parseInt(node.firstChild.nodeValue) : undefined
          break;
        case 'stringProp':
          object[name] = node.hasChildNodes() ? node.firstChild.nodeValue : undefined
          break;
        case 'boolProp':
          object[name] = node.hasChildNodes() ? node.firstChild.nodeValue === 'true' : false
          break
        case 'elementProp':
          if (node.parentNode.nodeName === 'collectionProp') {
            xml2json(object, node.children)
          } else {
            object[name] = {
              attributes: node.getAttributeNames().reduce((attributes, name) => {
                attributes[name] = node.getAttribute(name)
                return attributes
              }, {})
            }
            xml2json(object[name], node.children)
          }
          break;
        case 'collectionProp':
          object[name] = []
          xml2json(object[name], node.children)
          break;
        case 'objProp':
          // todo
          break;
      }
    })
  }
}

export function Jmx2Json(JmxContent) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(JmxContent, 'application/xml')
    console.log('load jmx success:', xmlDoc)
    const testPlan = []
    xml2json(testPlan, xmlDoc.getElementsByTagName('TestPlan')[0].parentNode.children)
    return testPlan
  } catch (err) {
    console.log(`load jmx error:`, err.stack)
  }
}

function json2xml(parent, object) {
  if (object instanceof Array) {
    object.forEach(item => json2xml(parent, item))
  } else {
    let tagName = parent.nodeName === 'hashTree' ? object['attributes']['testclass'] : 'elementProp'
    let child = document.createElementNS(null, tagName);
    Object.entries(object.attributes).forEach(([k, v]) => child.setAttribute(k, v))
    parent.appendChild(child);
    Object.entries(object).forEach(([name, value]) => {
      if (typeof value !== 'object') {
        let tag = undefined
        let text = undefined
        switch (typeof value) {
          case 'number':
            tag = 'intProp'
            text = String(value)
            break;
          case 'boolean':
            tag = 'boolProp'
            text = String(value)
            break;
          case 'string':
            tag = 'stringProp'
            text = value
        }
        let grandChild = document.createElementNS(null, tag);
        grandChild.setAttribute('name', name);
        grandChild.appendChild(document.createTextNode(text));
        child.appendChild(grandChild);
      } else if (value instanceof Array) {
        if (name === 'hashTree') {
          let sibling = document.createElementNS(null, 'hashTree')
          parent.appendChild(sibling)
          object['hashTree'].forEach(item => json2xml(sibling, item))
        } else {
          let grandChildElement = document.createElementNS(null, 'collectionProp');
          grandChildElement.setAttribute('name', name);
          child.appendChild(grandChildElement);
          json2xml(grandChildElement, value)
        }
      } else if (name !== 'attributes') {
        json2xml(child, value)
      }
    })
  }
}

export function Json2Jmx(nodes) {

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(`<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree/>
</jmeterTestPlan>`, 'application/xml')
  let root = xmlDoc.getElementsByTagName('hashTree')[0]
  json2xml(root, nodes)
  return xmlDoc
}
