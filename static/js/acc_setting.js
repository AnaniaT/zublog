const domain = location.origin;

// NON-IMAGE RELATED INPUTS
const inputForms = document.querySelectorAll("form.form");
inputForms.forEach((form) => {
  const input = form.querySelector("input.inp");
  const submitBtn = form.querySelector("button.submit");
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
  });

  const load = submitBtn.querySelector(".load");
  const good = submitBtn.querySelector(".good");
  const bad = submitBtn.querySelector(".bad");

  let checker;
  // change eventlistener did not work
  input.addEventListener("input", async () => {
    submitBtn.style.transform = "translateY(100%)";
    good.setAttribute("hidden", "");
    bad.setAttribute("hidden", "");
    load.removeAttribute("hidden");

    let code;
    let dataType = input.dataset.type;
    if (dataType === "0") {
      code = await checkField(input.value);
    }
    if (dataType === "1") {
      code = await checkField(undefined, input.value);
    }

    load.setAttribute("hidden", "");
    submitBtn.removeEventListener("click", checker);

    if (code === 200) {
      good.removeAttribute("hidden");
      bad.setAttribute("hidden", "");

      checker = (e) => {
        e.preventDefault();
        if (dataType === "0") {
          updateField(input.value);
        }
        if (dataType === "1") {
          updateField(undefined, input.value);
        }
      };
      submitBtn.addEventListener("click", checker);
    } else {
      good.setAttribute("hidden", "");
      bad.removeAttribute("hidden");
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      submitBtn.style.transform = "translateY(0)";
      form.querySelector('input[type="checkbox"]').click();
    }, 250);
  });
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const checkField = async (username, email) => {
  let data;
  if (username) {
    data = { username };
  } else if (email) {
    data = { email };
  } else {
    return;
  }
  return fetch(domain + "/account/checkup", {
    method: "POST",
    body: JSON.stringify(data),
    headers: new Headers({ "content-type": "application/json" }),
  })
    .then((res) => res.status)
    .catch((err) => alert("Something went wrong"));
};

const updateField = async (username, email) => {
  toggleLoadingBar();
  let data;
  if (username) {
    data = { username };
  } else if (email) {
    data = { email };
  } else {
    return;
  }
  await fetch(domain + "/account/setting", {
    method: "POST",
    body: JSON.stringify(data),
    headers: new Headers({ "content-type": "application/json" }),
  })
    .then(async () => {
      const formMsg = document.querySelector(".formMsg");
      formMsg.classList.add("good");
      formMsg.textContent = "Saved Successfuly";
      setTimeout(() => {
        formMsg.textContent = "";
        formMsg.classList.remove("good");
      }, 3000);
    })
    .catch((err) => alert("Something went wrong"));
  toggleLoadingBar(true);
};

// IMAGE RELATED INPUT
const imageForm = document.querySelector("form.pic-form");
let imageInput = imageForm.querySelector("#imagePicker");
const infoBox = imageForm.querySelector(".info-text");
const infoIcon = imageForm.querySelector(".info-icon");
const actionBox = imageForm.querySelector(".pic-action");
const save = imageForm.querySelector(".pic-saver");
const imgRemover = imageForm.querySelector(".pic-remove");
const discard = actionBox.querySelector(".pic-discard");

const renewInput = () => {
  imageInput = imageForm.querySelector("#imagePicker");
  imageInput.remove();
  imageInput = document.createElement("input");
  imageInput.setAttribute("type", "file");
  imageInput.setAttribute("id", "imagePicker");
  imageInput.setAttribute("hidden", "");
  imageInput.setAttribute("accept", ".png, .jpg, .jpeg");
  imageInput.addEventListener("change", (e) => imageChangeHandler(e));
  imageForm.querySelector(".opt").appendChild(imageInput);
  // this removes files selected (dont work work for opera, IE so taking the long way delete and regenerate the input element)
  // imageInput.value = "";
};

const optimizeString = (name) => {
  const len = parseInt(name.length);
  if (len > 30) {
    let nameList = name.split(".");
    const extention = "." + nameList.pop();
    const pureName = nameList.join(".");
    let newName = name.slice(0, 20);
    return newName + "..." + pureName.slice(pureName.length - 3) + extention;
  }
  return name;
};

{
  let infoTimeout;
  infoIcon?.addEventListener("click", () => {
    let msg = infoIcon.querySelector(".icon-msg");
    msg.style.display = "block";
    clearTimeout(infoTimeout);
    infoTimeout = setTimeout(() => {
      msg.removeAttribute("style");
    }, 3000);
  });
}

const imageChangeHandler = (e) => {
  const file = e.target.files[0];
  infoBox.removeAttribute("style");
  if (
    !file.name
      .trim()
      .toLowerCase()
      .match(/\.(jpg|jpeg|png)$/)
  ) {
    renewInput();
    infoBox.style.color = "#f51818";
    return (infoBox.textContent = "File not supported");
  }
  const sizeLimit = 2500000;
  if (file.size > sizeLimit) {
    renewInput();
    infoBox.style.color = "#f51818";
    return (infoBox.textContent = "File too large");
  }
  infoBox.textContent = optimizeString(file.name);
  actionBox.style.transform = "translateY(0)";
};

const handleImgSave = async (form) => {
  return await fetch(domain + "/account/avatar", {
    method: "POST",
    body: form,
  })
    .then(async (res) => {
      if (res.status === 200) {
        // get the file from the request
        return res.arrayBuffer();
      }
      const data = await res.json();
      throw new Error(data.error);
    })
    .then((arrayBuffer) => {
      // return a url for the image fetched after chanheing it to a blob file
      const src = URL.createObjectURL(
        new Blob([arrayBuffer], { type: "image/png" })
      );
      return [undefined, src];
    })
    .catch((err) => {
      return [err.message];
    });
};

const handleImgRemove = async () => {
  return await fetch(domain + "/account/avatar", {
    method: "DELETE",
  })
    .then((res) => {
      if (!res.status === 200) {
        throw new Error("No profile to delete");
      }
      return undefined;
    })
    .catch((err) => {
      return err.message;
    });
};

imageInput.addEventListener("change", (e) => imageChangeHandler(e));

discard.addEventListener("click", (e) => {
  e.preventDefault();
  if (imageInput.files.length > 0) {
    renewInput();
    actionBox.removeAttribute("style");
    infoBox.removeAttribute("style");
    infoBox.textContent = "No new profile selected";
  }
});

save.addEventListener("click", async (e) => {
  e.preventDefault();
  toggleLoadingBar();
  imageInput = e.target.parentElement.parentElement.querySelector(
    "#imagePicker"
  );
  let f = new FormData();
  f.set("avatar", imageInput.files[0]);
  const [err, imgSrc] = await handleImgSave(f);
  infoBox.removeAttribute("style");
  renewInput();
  if (err) {
    infoBox.style.color = "#f51818";
    return (infoBox.textContent = optimizeString(err));
  }
  infoBox.textContent = "Profile saved";
  actionBox.removeAttribute("style");
  let img = document.getElementById("profilePic");
  img.src = imgSrc;
  toggleLoadingBar(true);
});

if (imgRemover) {
  imgRemover.addEventListener("click", async (e) => {
    toggleLoadingBar();
    e.preventDefault();
    let err = await handleImgRemove();
    infoBox.removeAttribute("style");
    if (err) {
      infoBox.style.color = "#f51818";
      return (infoBox.textContent = err);
    }
    infoBox.textContent = "Profile removed";
    let img = document.getElementById("profilePic");
    img.src = "/img/account_card/user.svg";
    imgRemover.remove();
    toggleLoadingBar(true);
  });
}

// SOCIAL LINKS HANDLERS
{
  let socialFormActive = false;
  const socialLabel = document.querySelector(
    ".social-form-label > .label-data"
  );
  const activeIndicator = socialLabel.querySelector(".ellipse");
  const socialForm = document.querySelector(".social-form");
  socialLabel.addEventListener("click", () => {
    if (socialFormActive) {
      socialForm.classList.remove("active");
      socialForm.classList.add("deactive");
      socialFormActive = false;
      return activeIndicator.removeAttribute("style");
    }
    socialForm.classList.remove("deactive");
    socialForm.classList.add("active");
    socialFormActive = true;
    activeIndicator.style.transform = "rotate(0)";
  });
  const socailSave = socialForm.querySelector("#socialSave");
  const socialDiscard = socialForm.querySelector("#socialDiscard");
  const formMsg = document.querySelector(".formMsg");

  socailSave.addEventListener("click", async (e) => {
    toggleLoadingBar();
    e.preventDefault();
    const socailInputs = socialForm.querySelectorAll("input");
    let formBody = {};
    socailInputs.forEach((input) => {
      formBody[input.name] = input.value;
    });
    await fetch(domain + "/account/setting/social", {
      method: "POST",
      body: JSON.stringify(formBody),
      headers: new Headers({ "Content-type": "application/json" }),
    })
      .then(async (r) => {
        if (r.status === 200) {
          formMsg.classList.add("good");
          formMsg.textContent = "Changes saved";
          smoothScrollToTop();
          socialLabel.click();
          return setTimeout(() => {
            formMsg.classList.remove("good");
            formMsg.textContent = "";
          }, 4000);
        }
        throw new Error("Could not save data");
      })
      .catch((err) => {
        smoothScrollToTop();
        formMsg.classList.add("bad");
        formMsg.textContent = err.message;
        return setTimeout(() => {
          formMsg.classList.remove("bad");
          formMsg.textContent = "";
        }, 4000);
      });
    toggleLoadingBar(true);
  });

  socialDiscard.addEventListener("click", () => {
    socialLabel.click();
  });
}

// PASSWORD RELATED
const passLabel = document.querySelector(".pass-form-label > .label-data");
const passForm = document.querySelector(".pass-form");

let passFormActive;
passLabel.addEventListener("click", () => {
  const activeIndicator = passLabel.querySelector(".ellipse");
  if (passFormActive) {
    passForm.classList.add("deactive");
    passForm.classList.remove("active");
    passFormActive = false;
    return activeIndicator.removeAttribute("style");
  }
  passFormActive = true;
  passForm.classList.add("active");
  passForm.classList.remove("deactive");
  activeIndicator.style.transform = "rotate(0)";
});

let scrolldelay;
const smoothScrollToTop = () => {
  window.scrollBy(0, -4); // values are in pixels
  const stopAt = 17;
  const currentScroll =
    document.body.scrollTop == 0 // is true for Chrome, Firefox, IE and Opera b/c they dont support its scroll value its value equals the true scroll value for Safari
      ? document.documentElement.scrollTop
      : document.body.scrollTop;
  if (currentScroll <= stopAt) {
    return clearTimeout(scrolldelay);
  }
  scrolldelay = setTimeout(smoothScrollToTop, 0.5);
};

// OLD PASSWORD BLOCK
{
  const passInputs = passForm.querySelectorAll(".passInp");

  const passValidator = (pass, isConfirm = false, prefix = "") => {
    if (pass.length === 0) {
      return isConfirm
        ? "Please confirm your password"
        : prefix + " password is required";
    }
    if (isConfirm && passForm.querySelector("#newPass").value !== pass) {
      return "Passwords do not match";
    }
    if (pass.length < 7) {
      return prefix + " password is too short";
    }
  };

  passInputs.forEach((passInput) => {
    const submitBtn = passInput.parentElement.querySelector(".submit");
    const load = submitBtn.querySelector(".load");
    const good = submitBtn.querySelector(".good");
    const bad = submitBtn.querySelector(".bad");

    let typing = false;
    passInput.addEventListener("input", async (e) => {
      typing = true;
      const passVal = e.target.value;
      submitBtn.style.transform = "translateY(100%)";
      good.setAttribute("hidden", "");
      bad.setAttribute("hidden", "");
      load.removeAttribute("hidden");

      if (passInput.id === "oldPassword" && passVal.length > 7) {
        load.setAttribute("hidden", "");
        typing = false;
        return submitBtn.removeAttribute("style");
      }
      setTimeout(() => {
        if (!typing) {
          load.setAttribute("hidden", "");
          good.setAttribute("hidden", "");
          bad.setAttribute("hidden", "");
          let err;
          if (passInput.id === "confirmPass") {
            err = passValidator(passVal, true);
          } else {
            err = passValidator(passVal);
          }
          if (err) {
            return bad.removeAttribute("hidden");
          }
          if (passInput.id === "oldPassword") {
            good.setAttribute("hidden", "");
            bad.setAttribute("hidden", "");
            load.setAttribute("hidden", "");
            return submitBtn.removeAttribute("style");
          }
          return good.removeAttribute("hidden");
        }
      }, 750);
      typing = false;
    });
  });

  const passDiscard = passForm.querySelector("#passDiscard");
  passDiscard.addEventListener("click", () => {
    let allPassBlock = passForm.querySelectorAll(".form");
    allPassBlock.forEach((passBlock) => {
      passBlock.querySelector('input[type="password"]').value = "";
      let submitBtn = passBlock.querySelector(".submit");
      submitBtn.querySelector(".load").setAttribute("hidden", "");
      submitBtn.querySelector(".good").setAttribute("hidden", "");
      submitBtn.querySelector(".bad").setAttribute("hidden", "");
      submitBtn.removeAttribute("style");
    });
    passLabel.click();
  });

  const passSave = passForm.querySelector("#passSave");
  passSave.addEventListener("click", async (e) => {
    e.preventDefault();
    const formMsg = document.querySelector(".formMsg");
    // validate the old password
    const oldPassInput = passForm.querySelector("#oldPassword");
    let oldPassErr = passValidator(oldPassInput.value, false, "Old");
    if (oldPassErr) {
      smoothScrollToTop();
      formMsg.classList.add("bad");
      formMsg.textContent = oldPassErr;
      return setTimeout(() => {
        formMsg.classList.remove("bad");
        formMsg.textContent = "";
      }, 4000);
    }
    // validate the new password group
    let newPassErr, confirmPassErr, newPass, confirmPass;
    passInputs.forEach((passInput) => {
      const passVal = passInput.value;
      if (passInput.id === "confirmPass") {
        confirmPassErr = passValidator(passVal, true);
        confirmPass = passVal;
      } else if (passInput.id === "newPass") {
        newPass = passVal;
        newPassErr = passValidator(passVal, false, "New");
      }
    });
    if (newPassErr || confirmPassErr) {
      smoothScrollToTop();
      formMsg.classList.add("bad");
      formMsg.textContent = newPassErr || confirmPassErr;
      return setTimeout(() => {
        formMsg.classList.remove("bad");
        formMsg.textContent = "";
      }, 4000);
    }

    toggleLoadingBar();
    await fetch(domain + "/account/setting/resetpassword", {
      method: "POST",
      body: JSON.stringify({
        password: oldPassInput.value,
        newPassword: newPass,
        confirmPassword: confirmPass,
      }),
      headers: new Headers({ "Content-type": "application/json" }),
    })
      .then(async (r) => {
        console.log(r.status);
        if (r.status === 200) {
          passDiscard.click(); // reverts to the beginning state
          formMsg.classList.add("good");
          formMsg.textContent = "Password Changed";
          return setTimeout(() => {
            formMsg.classList.remove("good");
            formMsg.textContent = "";
          }, 4000);
        }
        throw new Error(
          await r
            .json()
            .then((d) => d.error)
            .catch((e) => "Something went wrong")
        );
      })
      .catch((err) => {
        smoothScrollToTop();
        formMsg.classList.add("bad");
        formMsg.textContent = err.message;
        return setTimeout(() => {
          formMsg.classList.remove("bad");
          formMsg.textContent = "";
        }, 4000);
      });
    toggleLoadingBar(true);
  });
}
