const toggleLoadingBar = (stop = false) => {
  if (stop) {
    let loadingBar = document.querySelector("#loading-bar");
    loadingBar?.remove();
    return;
  }
  let loadingBar = document.createElement("div");
  let loadingBarSpan = document.createElement("span");
  loadingBar.id = "loading-bar";
  loadingBar.appendChild(loadingBarSpan);
  document.body.appendChild(loadingBar);
};
