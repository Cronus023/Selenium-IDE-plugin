import browser from 'webextension-polyfill'
import React from 'react'
import '../../styles/app.css'
import OpenInput from '../../components/OpenInput'

export default class Panel extends React.Component {
  constructor(props) {
    super(props)
    this.loadAsText = this.loadAsText.bind(this)
    this.emitFileContents = this.emitFileContents.bind(this)
  }

  loadAsText(blob) {
    return new Promise(res => {
      const fileReader = new FileReader()
      fileReader.onload = e => {
        res(e.target.result)
      }

      fileReader.readAsText(blob)
    })
  }

  emitFileContents(contents) {
    browser.runtime.sendMessage({
      fileUploaded: true,
      name: 'fileContents', // var name
      contents: contents, // file contents
    })
  }

  async logHandler() {
    const result = await browser.runtime.sendMessage('mooikfkahbdckldjjndioackbalphokd', {
      uri: "/log",
      verb: "post",
      payload: {
        type: 'error', // error, warn, undefined
        message: 'You click button "Add log"'
      }
    })

    alert(result)
  }

  render() {
    return (
      <div>
        <OpenInput
          onFileSelected={file => {
            this.loadAsText(file).then(contents => {
              this.emitFileContents(contents)
            })
          }}
        />
        <button onClick={this.logHandler}>Add log</button>
        <button onClick={this.logHandler}>Add alert</button>
      </div>
    )
  }
}
