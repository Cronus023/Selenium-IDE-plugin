// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import browser from 'webextension-polyfill'
import UAParser from 'ua-parser-js'
import {CSVtoJSON} from './parsers'

const parser = new UAParser(window.navigator.userAgent)
const browserName = parser.getBrowser().name
const isChrome = browserName === 'Chrome'
const isFirefox = browserName === 'Firefox'

function getId() {
    if (process.env.SIDE_ID) return process.env.SIDE_ID
    return isChrome
        ? 'mooikfkahbdckldjjndioackbalphokd'
        : isFirefox
            ? '{a6fd85ed-e919-4a43-a5af-8da18bda539f}'
            : ''
}

const seideId = getId()

function startPolling(payload) {
    setInterval(() => {
        browser.runtime
            .sendMessage(seideId, {
                uri: '/health',
                verb: 'get',
            })
            .catch(res => ({error: res.message}))
            .then(res => {
                if (!res) {
                    browser.runtime.sendMessage(seideId, {
                        uri: '/register',
                        verb: 'post',
                        payload,
                    })
                }
            })
    }, 1000)
}

startPolling({
    name: 'Jazzteam plugin',
    version: '1.0.0',
    commands: [
        {
            id: "testCommand",
            name: "Open Jazzteam"
        }
    ]
})

let uploadedFile = {}

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log(message)
    if (message.fileUploaded) {
        uploadedFile.name = message.name
        uploadedFile.contents = CSVtoJSON(message.contents)
        return sendResponse(true)
    }
})

async function logNewCommand() {
    return await browser.runtime.sendMessage(seideId, {
        uri: "/log",
        verb: "post",
        payload: {
            type: 'warn', // error, warn, undefined
            message: 'New command has been clicked"'
        }
    })
}

browser.runtime.onMessageExternal.addListener(
    (message, _sender, sendResponse) => {
        console.log(message)
        if (message.action === "execute" && message.command) {
            console.log("I need to execute a command");
            return sendResponse(true);
        }

        if (message.action === "emit") {
            if (message.project) {
                return sendResponse({
                    canEmit: true
                });
            }

            if (message.command.command === "testCommand") {
                sendResponse("await driver.get('https://jazzteam.org/en/');");
            }
        }

        if (message.event === 'playbackStarted') {
            browser.runtime
                .sendMessage(seideId, {
                    uri: '/playback/var',
                    verb: 'put',
                    payload: uploadedFile,
                })
                .then(() => {
                    return sendResponse(true)
                })
            return true
        }
        sendResponse(undefined)
    }
)
