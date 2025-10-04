const descrption = document.getElementById("description");
const printButton = document.getElementById("print")

const print = () => {
    window.print();
}

printButton.addEventListener(("click"), () => {
    print()
})

const articleElem = document.querySelector("article");
const selectElem = document.querySelector("select");

selectElem.addEventListener("change", () => {
  articleElem.className = selectElem.value;
});