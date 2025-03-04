
const selectBtn = document.querySelector('.select-btn');
items = document.querySelectorAll('.item');
selectBtn.addEventListener('click', () => {
    selectBtn.classList.toggle('open');
});

items.forEach((item => {
    item.addEventListener('click', () => {
        item.classList.toggle("checked");
        let checked = document.querySelectorAll('.checked');
        console.log('checked>>>>', checked);
        btnText = document.querySelector(".btn-text");
        btnText.innerText = `${checked.length > 0 ? `${checked.length} Selected` : 'Choose Categroy'} `;
    });
}
));

document.addEventListener("DOMContentLoaded", () => {
    let checked = document.querySelectorAll(".checked");
    let btnText = document.querySelector(".btn-text");
    btnText.innerText = `${checked.length > 0 ? `${checked.length} Selected` : "Choose Category"}`;
});
