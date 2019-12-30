import data from './modules/loadData.js'
import transform from './modules/transformData.js'

const allQuestionCategories = d3.selectAll('.question_category')._groups[0],
    labels = document.querySelectorAll('form label'),
    tooltip = document.querySelector('#tooltip'),
    digitRegex = /^\d+$/

let tooltipData, //receives toolltip-data (async)
    pressedKey, //last fired event.key
    secondCar = false

data.getData() //fetch dataset-data
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => transform.createHousehold(csvRows))
    .catch(err => console.log(err))

data.getTooltips() //fetch tooltip-data
    .then(data => tooltipData = data)
    .then(data => addTooltips())
    .catch(err => console.log(err))


//tooltip
function addTooltips() { //fixes tooltip styling, content & tooltip location 
    Object.entries(tooltipData).forEach(entry => {
        labels.forEach(label => {
            if (label.getAttribute('for') == entry[0]) { //check if label should get a tooltip
                label.dataset.has_tooltip = true

                let tooltipIcon = new Image //add tooltip-icons to DOM
                tooltipIcon.classList.add('tooltip-icon')
                tooltipIcon.src = "./media/tooltip-icon.svg"
                label.append(tooltipIcon)

                label.children[0].addEventListener('mousemove', function () {
                    tooltip.children[0].textContent = entry[1]
                    tooltip.style.display = 'block'
                    tooltip.style.left = event.pageX + 20 + 'px'
                    tooltip.style.top = event.pageY + 'px'

                    if (event.pageY + tooltip.getBoundingClientRect().height > window.innerHeight + window.scrollY) {
                        tooltip.style.top = (event.pageY - tooltip.getBoundingClientRect().height) + 10 + 'px' //make sure the whole tooltip is in viewport
                    }
                })

                tooltipIcon.addEventListener('mouseout', function () { //hide tooltip when user-cursor leaves tooltip-icon
                    tooltip.style.display = 'none'
                })
            }
        })
    })
}

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input =>
    input.addEventListener('input', function () { //call functions on input
        checkIfValueIsAllowed(this) //value validation
        checkAdditionalQuestions(this) //check for additional questions
        updateProgressbar() //progress-bar
        updateProgressIndicators(this) //progress indicator
        updateTotalIncome(this) //total income
        fixSelectFocus(this) //fix select focus state
    }))
document.querySelectorAll('input, select').forEach(input =>
    input.addEventListener('keydown', function (e) {
        pressedKey = e
    }))


function checkIfValueIsAllowed(currentEl) {
    let minIsValid = false,
        maxIsValid = false

    if (currentEl.type === 'number') { //checking if value is valid according to min & max attribute-values
        if (parseInt(currentEl.value) < parseInt(currentEl.min) === false && digitRegex.test(currentEl.value) === true) {
            minIsValid = true
        }
        if (parseInt(currentEl.value) > parseInt(currentEl.max) === false && digitRegex.test(currentEl.value) === true) {
            maxIsValid = true
        }

        if (maxIsValid && minIsValid && currentEl.value !== "" && currentEl.value.includes(',') === false) {
            currentEl.classList.remove('invalid') //fix & reset styling according to number of invalid answer

            d3.selectAll('.invalid-warning')._groups[0].forEach(warning => {
                if (warning.previousSibling.classList.contains('invalid') === false) {
                    warning.remove() //remove all unnecessary/unvalid warnings
                }
            })
        } else {
            currentEl.classList.add('invalid')

            let invalidTextContent = ""
            if (currentEl.value === "" && pressedKey.key === 'Backspace') { //value is empty
                invalidTextContent = "Antwoord moet ingevuld worden"
            } else if (minIsValid === false) { //value is smaller than min-value
                invalidTextContent = "Antwoord moet groter zijn dan " + currentEl.min
            } else if (maxIsValid === false) { //value is higher than max-value
                invalidTextContent = "Antwoord moet kleiner zijn dan " + currentEl.max
            }
            if (pressedKey.key == ',' || pressedKey.key == '.' || pressedKey.key == '+' || pressedKey.key == '-') { //value contains disallowed chars 
                invalidTextContent = "Antwoord mag geen " + pressedKey.key + " bevatten"
            }

            if (currentEl.nextSibling.tagName != 'SPAN') { //create warning 
                const createWarning = document.createElement('span')
                event.target.parentNode.insertBefore(createWarning, event.target.nextSibling) //insert createWarning as next element on same level in DOM
                createWarning.classList.add('invalid-warning')
                createWarning.textContent = invalidTextContent
                createWarning.style.left = currentEl.getBoundingClientRect().left + -30 + "px"

                if (currentEl === document.querySelector('#kinderen')) { //additional position-styling for #kinderen
                    createWarning.style.width = currentEl.getBoundingClientRect().width + "px"
                }
            } else {
                currentEl.nextSibling.textContent = invalidTextContent //update warning text-content
            }
        }
    }
}

function checkAdditionalQuestions(currentEl) {
    if (currentEl === document.getElementById('wel-partner')) {
        for (const input of document.querySelectorAll('[data_question="2"] > fieldset:nth-of-type(2) input')) {
            input.setAttribute('data_path', true)
            updateProgressIndicators(document.querySelector('[data_question="2"]'))
        }
    } else if (currentEl === document.getElementById('geen-partner')) {
        for (const input of document.querySelectorAll('[data_question="2"] > fieldset:nth-of-type(2) input')) {
            input.setAttribute('data_path', false)
            updateProgressIndicators(document.querySelector('[data_question="2"]'))
        }
    } else if (currentEl === document.getElementById('kinderen')) {
        console.log('voeg kinderen toe')
        //todo: voeg kinderen toe 
    } else if (currentEl === document.getElementById('huur')) {
        document.getElementById('huurPerMaand').setAttribute('data_path', true)
        document.getElementById('hypotheekPerMaand').setAttribute('data_path', false)
        document.getElementById('woz').setAttribute('data_path', false)
    } else if (currentEl === document.getElementById('koop')) {
        document.getElementById('huurPerMaand').setAttribute('data_path', false)
        document.getElementById('hypotheekPerMaand').setAttribute('data_path', true)
        document.getElementById('woz').setAttribute('data_path', true)
    } else if (currentEl === document.getElementById('car')) {
        console.log('fix meerdere autos')
        //todo: voeg meerdere auto's toe
        if (document.getElementById('car').value != 'geen') {
            document.getElementById('kilometers').setAttribute('data_path', true)
            document.getElementById('nieuw').setAttribute('data_path', true)
            document.getElementById('tweedehands').setAttribute('data_path', true)
        } else {
            document.getElementById('kilometers').setAttribute('data_path', false)
            document.getElementById('nieuw').setAttribute('data_path', false)
            document.getElementById('tweedehands').setAttribute('data_path', false)
        }
    }

    if (event.target === document.getElementById('extraAuto')) {
        document.getElementById('car2').setAttribute('data_path', true)
        document.getElementById('kilometers2').setAttribute('data_path', true)
        document.getElementById('nieuw2').setAttribute('data_path', true)
        document.getElementById('tweedehands2').setAttribute('data_path', true)
    }
    //TODO: voeg een icon toe om 2e auto weg te halen
    //TODO: zorg dat de data_path attributen op false gezet worden als de 2e auto weggehaald word
    //TODO: zorg dat de progressbar & progressindicators goed werken met geen/1/2 auto's
}

function updateProgressbar() {
    let inputsWithValue = 0,
        numberOfTotalRadio = 0,
        allInputs = d3.selectAll('[data_path="true"]')._groups[0]

    allInputs.forEach(input => { //checking all inputs for values & radio inputs
        if (input.tagName === 'SELECT' && input.value != '' ||
            input.type === 'radio' && input.checked === true ||
            input.type !== 'radio' && input.tagName !== 'SELECT' && input.value != '') {
            inputsWithValue++
        }
        if (input.type === 'radio') {
            numberOfTotalRadio++
        }
    })
    let uniqueInputs = allInputs.length - (numberOfTotalRadio / 2),
        progression = document.querySelector('#uw_situatie #progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue
    document.querySelector('#uw_situatie #progression').style.paddingRight = progression + "px" //calculating progress & updating in DOM/styling

    let hasInvalidValue = false
    for (const input of allInputs) {
        if (input.classList.contains('invalid')) { //checking for invalid values
            hasInvalidValue = true
        }
    }
    if (inputsWithValue === uniqueInputs && hasInvalidValue === false) { //hide & fixing styling
        document.querySelector('section:nth-of-type(2)').classList.remove('hide')
    } else {
        document.querySelector('section:nth-of-type(2)').classList.add('hide')
        document.getElementById('progression').classList.add('invalidProgress')
    }
    if (hasInvalidValue === false) {
        document.getElementById('progression').classList.remove('invalidProgress') //reset styling if all invalid values have been corrected
    }
}

function updateProgressIndicators(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }

    let allCurrentInputs = currentEl.querySelectorAll('[data_path="true"]'), //all currently [data-path="true"] inputs
        answeredQuestions = 0,
        numberOfRadios = 0,
        hasInvalidValue = 0

    for (const currentInput of allCurrentInputs) {
        if (currentInput.type === 'radio' && currentInput.checked === true || currentInput.type !== 'radio' && currentInput.value != '') { //check for answers
            answeredQuestions++
        }
        if (currentInput.type === 'radio') { //check for radio input
            numberOfRadios++
        }
        if (currentInput.classList.contains('invalid')) { //check for invalid values
            hasInvalidValue++
        }
    }

    if (answeredQuestions === allCurrentInputs.length - (numberOfRadios / 2)) { //style progress-indicator color if all questions are answered
        currentEl.querySelector('div>span:first-of-type').classList.add('hasAnswer')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('hasAnswer')
    }

    if (hasInvalidValue) { //fix styling for invalid values
        currentEl.querySelector('div>span:first-of-type').classList.add('invalidValue')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('invalidValue')
    }

    if (currentEl.getAttribute('data_question') === '4' && document.getElementById('car').value != 'geen' && currentEl.querySelector('div > span:first-of-type').classList.contains('hasAnswer')) {
        document.getElementById('extraAuto').classList.remove('hide')
    }
}

//total income
function updateTotalIncome(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }

    if (currentEl.getAttribute('data_question') === '2') { //prevents multi-question sums
        const allCurrentInputs = currentEl.querySelectorAll('input')
        let totalIncome = 0,
            questionsAnswered = 0

        for (const currentInput of allCurrentInputs) { //fix the total income
            if (currentInput.value != '') {
                totalIncome = totalIncome + parseInt(currentInput.value)
                document.getElementById('totaleInkomen').textContent = totalIncome + " euro"
                document.getElementById('totalIncome').classList.remove('hide')
                questionsAnswered++
            }
        }
        if (questionsAnswered === 0) { //hide totalIncome if no question has been answered
            document.getElementById('totalIncome').classList.add('hide')
        }
    }
}

//fix SELECT element focus
function fixSelectFocus(currentEl) {
    if (currentEl.tagName === 'SELECT') {
        currentEl.parentElement.focus() //give focus to select when it's the active element
    }
}

//progressive disclosure
allQuestionCategories.forEach(category => {
    category.addEventListener('click', function () { //give all question-categories an eventListener
        for (const question of allQuestionCategories) { //reset styling for all question-categories & dropdown images
            question.classList.remove('hide')
            question.classList.add('hide')
            question.querySelector('div:first-of-type>img').classList.remove('activeDropdown')
        }
        category.querySelector('div:first-of-type>img').classList.add('activeDropdown')
        this.classList.remove('hide') //show questions of current category

        if (event.target.tagName != 'LABEL' && event.target.tagName != 'INPUT' && event.target.tagName != 'SELECT') {
            this.querySelectorAll('input, select')[0].focus() //when opening a new question-category -> give first input focus
        }
    }, false)
})

//car styling
document.getElementById('car').addEventListener('input', function () { //fix car styling
    if (this.value != 'geen') {
        document.getElementById('has_a_car').classList.remove('hide') //if user doesn;t have a car -> hide additional questions
    } else {
        document.getElementById('has_a_car').classList.add('hide') //if user has a car -> show additional questions
    }
})
document.getElementById('extraAuto').addEventListener('click', function () { //add additional car
    document.getElementById('has_a_second_car').classList.remove('hide')
    document.getElementById('extraAuto').classList.toggle('hide')
    secondCar = true
    checkAdditionalQuestions()
})