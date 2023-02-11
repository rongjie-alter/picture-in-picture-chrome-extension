// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function isElementInViewport(rect) {
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}

function findLargestPlayingVideo() {
  let videos = Array.from(document.querySelectorAll('video'));
  if (videos.length == 1) return videos[0];

  videos = videos.filter(video => video.readyState != 0)
    .filter(video => video.disablePictureInPicture == false)
    .map(video => { return {rect: video.getBoundingClientRect(), video: video}; })
    .filter(item => isElementInViewport(item.rect))
    .sort((v1, v2) => {
      return ((v2.rect.width * v2.rect.height) - (v1.rect.width * v1.rect.height));
    });

  if (videos.length === 0) {
    return;
  }

  return videos[0].video;
}

async function requestPictureInPicture(video) {
  await video.requestPictureInPicture();
  video.setAttribute('__pip__', true);
  video.addEventListener('leavepictureinpicture', event => {
    video.removeAttribute('__pip__');
  }, { once: true });
  new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(video);
}

function maybeUpdatePictureInPictureVideo(entries, observer) {
  const observedVideo = entries[0].target;
  if (!document.querySelector('[__pip__]')) {
    observer.unobserve(observedVideo);
    return;
  }
  const video = findLargestPlayingVideo();
  if (video && !video.hasAttribute('__pip__')) {
    observer.unobserve(observedVideo);
    requestPictureInPicture(video);
  }
}



(async function() {
  const whitelist = [
    "https://www.disneyplus.com",
    "https://www.netflix.com",
  ];

  if (whitelist.some(url => window.location.href.startsWith(url))) {
    Array.from(document.querySelectorAll('video'))
      .forEach(video => video.removeAttribute("disablePictureInPicture"));
  }

  const video = findLargestPlayingVideo();
  if (!video) {
    return;
  }
  if (video.hasAttribute('__pip__')) {
    document.exitPictureInPicture();
    return;
  }
  await requestPictureInPicture(video);
})();
