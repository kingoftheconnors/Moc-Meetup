
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

function addPreset() {
    var presetName = $("#viewPreset").val();
    var presetItem = $("#viewPreset option:selected").data("classlist");
    if(!presetItem) {
        console.log("Please choose a preset!")
        alert("Please choose a preset!")
        return false;
    }
    var classList = presetItem.split('|');
    if($(`#${presetName}preset`).length > 0) {
        console.log("Preset already exists in schedule!")
        alert("Preset already exists in schedule!")
        return false;
    }
    if(presetName != '') {
        $('#classBoxPlaceholder').remove();
        var newElem = $(`
            <div id="${presetName}preset" class="preset">
                <div class="row">
                    <div class="col-9 col-md-10 align-self-center pl-4"> <button class="btn-primary form-control" type="button" data-toggle="collapse" data-target="#${presetName}classes">${presetName}</button></div>
                    <div class="col-3 col-md-2"><button class="btn-info form-control btn-class-delete" type="button"><i class="fa fa-times"></i></button></div>
                </div>
                <div id="${presetName}classes" class="collapse pl-2">
                </div>
            </div>
        `)
        newElem.find('.btn-class-delete').on('click', function() {
            $(this).closest('.preset').remove();
        })
        // Add classes to accordion
        for (var className of classList) {
            var classElem = generateClassElement(className, "> " + className);
            newElem.find('.collapse').append(classElem);
        }
        // Add preset to classBox
        $('#classBox').append(newElem);
        // Clear preset input field
        $('#viewPreset').val("Use a Preset of classes...");
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