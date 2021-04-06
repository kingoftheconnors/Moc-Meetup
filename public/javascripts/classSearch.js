
function addClass() {
    var className = $("#classBrowser").val();
    if(className != '') {
        $('#classBoxPlaceholder').remove();
        var newElem = $(`
            <div class="row">
                <input type="hidden" name="classes" value="${className}">
                <div class="col-9 col-md-10 align-self-center pl-4">${className}</div>
                <div class="col-3 col-md-2"><button class="btn-info form-control btn-class-delete" type="button"><i class="fa fa-times"></i></button></div>
            </div>
        `)
        newElem.find('.btn-class-delete').on('click', function() {
            $(this).closest('.row').remove();
        })
        $('#classBox').append(newElem);
        $("#classBrowser").val("");
    }
    return false;
}