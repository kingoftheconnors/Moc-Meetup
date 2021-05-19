
function addClass() {
    var className = $("#classBrowser").val();
    if($('.classes').filter(function() { return this.value.toLowerCase() == className.toLowerCase()}).length > 0) {
        console.log("Class already exists in schedule!")
        alert("Class already exists in schedule!")
        return false;
    }
    if(className != '') {
        $('#classBoxPlaceholder').remove();
        var newElem = generateClassElement(className, className);
        // Add class to classBox
        $('#classBox').append(newElem);
        // Clear class input field
        $("#classBrowser").val("");
    }
    return false;
}

function generateClassElement(className, classText) {
    var newElem = $(`
        <div class="row">
            <input type="hidden" class="classes" name="classes" value="${className}">
            <div class="col-9 col-md-10 align-self-center pl-4">${classText}</div>
            <div class="col-3 col-md-2"><button class="btn-info form-control btn-class-delete" type="button"><i class="fa fa-times"></i></button></div>
        </div>
    `)
    newElem.find('.btn-class-delete').on('click', function() {
        $(this).closest('.row').remove();
    })
    return newElem;
}