const domain = location.origin;

const deleteBtn = document.querySelector(".delete");
const modalTitle = document.querySelector(".modal-title");
const modalBody = document.querySelector(".modal-body");

deleteBtn.addEventListener("click", (e) => {
  document.getElementById("modalOpener").checked = true;
  modalTitle.textContent = "Are you sure you want to delete this post?";
  modalBody.textContent =
    "Please be completely sure about this because there will be no way back once you have actually deleted a post.";
});

const modalDelBtn = document.querySelector(".modal-delete-btn");
modalDelBtn.addEventListener("click", async () => {
  modalDelBtn.textContent = "Deleting...";
  const id = document.querySelector("#postId").value;
  await fetch(domain + "/posts", {
    method: "DELETE",
    body: JSON.stringify({ id }),
    headers: new Headers({ "Content-type": "application/json" }),
  })
    .then((r) => {
      console.log(r.status);
      if (r.status === 200) {
        return r.json();
      }
      throw new Error();
    })
    .then(({ title }) => {
      modalTitle.textContent = "Post Deleted";
      modalBody.textContent = `Your post '${title.slice(
        0
      )}' has been deleted successfuly. This post will now no longer be available to you or anyone else :(`;
      modalDelBtn.hidden = true;
      const close = document.querySelector(".modal-close-btn");
      close.textContent = "Home";
      close.addEventListener("click", () => {
        location.assign("/home");
      });
    })
    .catch((e) => {
      alert("Could not delete the requested post");
      location.reload();
    });
});
