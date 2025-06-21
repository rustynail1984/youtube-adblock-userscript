// ==UserScript==
// @name         YouTube Video Ad Blocker
// @namespace    https://www.youtube.com/
// @version      1.0.1
// @description  Modify's YouTube Player API Requests to add adPlaybackContext
// @author       RustyNail
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const originalFetch = window.fetch;
    window.fetch = async function(resource, options = {}) {
        const url = typeof resource === 'string' ? resource : resource.url;

        if (url.includes('youtubei/v1/player')) {
            let bodyToModify = null;
            let modifiedResource = resource;
            let modifiedOptions = { ...options };

            if (options.body) {
                bodyToModify = options.body;
            }
            else if (typeof resource === 'object' && resource.body) {
                try {
                    const clonedRequest = resource.clone();
                    bodyToModify = await clonedRequest.text();
                } catch (e) {
                    console.error('Error reading body from request: ', e);
                }
            }

            if (bodyToModify) {
                try {
                    const modifiedBody = modifyRequestBody(bodyToModify);

                    if (options.body) {
                        modifiedOptions.body = modifiedBody;
                    } else {
                        modifiedResource = new Request(resource.url, {
                            method: resource.method,
                            headers: resource.headers,
                            body: modifiedBody,
                            mode: resource.mode,
                            credentials: resource.credentials,
                            cache: resource.cache,
                            redirect: resource.redirect,
                            referrer: resource.referrer,
                            duplex: 'half'
                        });
                    }
                } catch (e) {
                    console.error('Error modifying fetch body: ', e);
                }
            } else {
                console.log('No body found in this request');
            }

            return originalFetch.call(this, modifiedResource, modifiedOptions);
        }

        return originalFetch.call(this, resource, options);
    };

    function modifyRequestBody(body) {
        try {
            let bodyObj;

            if (typeof body === 'string') {
                bodyObj = JSON.parse(body);
            } else {
                return body;
            }

            if (!bodyObj.videoId || !bodyObj.playbackContext) {
                return body;
            }

            bodyObj.playbackContext.adPlaybackContext = {
                pyv: true,
                adType: "AD_TYPE_INSTREAM"
            };

            console.info('✅ adPlaybackContext added to playbackContext');
            return JSON.stringify(bodyObj);
        } catch (e) {
            console.error('Error parsing/modifying body:', e);
            return body;
        }
    }

    console.log('YouTube API Request Modifier loaded');
})();
