let allInputs = d3.selectAll('input')._groups[0]

function update() {
    let inputWithValue = 0
    allInputs.forEach(input => {
        if (input.value != "") {
            inputWithValue++
        }
    });
    let progression = document.querySelector('#progression').parentElement.getBoundingClientRect().width / allInputs.length * inputWithValue

    document.querySelector('#progression').style.paddingRight = progression + "px"
    document.querySelector('#progression').textContent = inputWithValue / allInputs.length * 100 + "%"
}

document.querySelectorAll('input').forEach(input => input.addEventListener('input', () => update()))