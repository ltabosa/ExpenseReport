$(document).ready(function () {

    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', monthYearFieldFill);
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', lookupProject);
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', setLoggedInUser);
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', CheckMemberInAdminGroup);

    projectInfo = new Array();
    projectCount = 0;
    sumCol = 0;
    count = 0;
    colCreated = 0;
    dateRequest = "";
    submitClicked = true;
    array = new Array();
    projectArray = new Array();
    monthsInNumber = [["January", 1], ["February", 2], ["March", 3], ["April", 4], ["May", 5], ["June", 6], ["July", 7], ["August", 8], ["September", 9], ["October", 10], ["November", 11], ["December", 12]];

    //$(".changeDate").focusout(function () {
    //    numberOfDaysInMonth();
    //    weekendDay();
    //    holiday();
    //});

    //otherProject
    $("#otherExpense").click(function () {
        newLineOfProject();
    });
    //Delete Selected Lines
    $("#deleteLine").click(function () {
        deleteLineOfProject();
    });
    $("#Submit").click(function () {
        //get month and year
        monthSubmit = $('#txtMonth').val();
        yearSubmit = $('#txtYear').val();

        //Update Array With the Most Recent Data
        fillArray();
        //avoid multiple submit
        if (submitClicked) {
            submitClicked = false;
            var errorMes = "";
            for (var i = 0; i < count ; i++) {
                if (((array[i][1] == null) || (array[i][1] == undefined)) && (array[i][14] !== "Deleted")) {
                    errorMes = '<div class="alert alert-danger">' +
                            '<strong>Atention!</strong> Please fill the field <strong>Project</strong>.' +
                        '</div>';
                    submitClicked = true;

                }
                if (((array[i][2] == null) || (array[i][2] == undefined) || (array[i][2] == "")) && (array[i][14] !== "Deleted")) {
                    errorMes += '<div class="alert alert-danger">' +
                            '<strong>Atention!</strong> Please fill the field <strong>Date</strong>.' +
                        '</div>';
                    submitClicked = true;

                }
            }
            if (sumCol == 0) {
                errorMes += '<div class="alert alert-danger">' +
                               '<strong>Atention!</strong> You can not send this project empty.' +
                           '</div>';
                submitClicked = true;
            }
            $("#errorMsg").html(errorMes);
            if (errorMes == "") {
                //get user ID
                var users = $('#peoplePickerDivLinMan_TopSpan_HiddenInput').val();
                users = users.substring(1, users.length - 1);
                var obj = JSON.parse(users);
                getUserId(obj.AutoFillKey);
            }
        }//submitclicked
    });
    //Delete error msg
    $("body").focusout(function () {
        $("#errorMsg").html("");
    });

});

function monthYearFieldFill() {
    $('#txtMonth').datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: 'MM',
        onClose: function (dateText, inst) {
            var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            $(this).datepicker('setDate', new Date(year, month, 1));
        }
    });
    $("#txtMonth").focus(function () {
        $(".ui-datepicker-year").hide();
    });
    $('#txtYear').datepicker({
        changeYear: true,
        dateFormat: 'yy',
        onClose: function (dateText, inst) {
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            $(this).datepicker('setDate', new Date(year, 1));
        }
    });
    $("#txtYear").focus(function () {
        $(".ui-datepicker-month").hide();
    });
    var d = new Date();
    var n = d.getFullYear();
    document.getElementById('txtYear').value = n;
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('txtMonth').value = monthNames[d.getMonth()];
};

function setLoggedInUser() {
    var userid = _spPageContextInfo.userId;
    var requestUri = _spPageContextInfo.webAbsoluteUrl + "/_api/web/getuserbyid(" + userid + ")";
    var requestHeaders = { "accept": "application/json;odata=verbose" };
    $.ajax({
        url: requestUri,
        contentType: "application/json;odata=verbose",
        headers: requestHeaders,
        success: onSuccess,
        error: onError
    });

    function onSuccess(data, request) {
        var loginName = data.d.Title;
        var userAccountName = data.d.LoginName;

        var schema = {};
        schema['PrincipalAccountType'] = 'User,DL,SecGroup,SPGroup';
        schema['SearchPrincipalSource'] = 15;
        schema['ResolvePrincipalSource'] = 15;
        schema['AllowMultipleValues'] = false;
        schema['MaximumEntitySuggestions'] = 50;
        schema['Width'] = '280px';

        //Create logged in object
        var users = new Array(1);
        var defaultUser = new Object();
        defaultUser.AutoFillDisplayText = data.d.Title;
        defaultUser.AutoFillKey = data.d.LoginName;
        defaultUser.Description = data.d.Email;
        defaultUser.DisplayText = data.d.Title;
        defaultUser.EntityType = "User";
        defaultUser.IsResolved = true;
        defaultUser.Key = data.d.LoginName;
        defaultUser.Resolved = true;
        users[0] = defaultUser;
        SPClientPeoplePicker.ShowUserPresence = false;
        SPClientPeoplePicker_InitStandaloneControlWrapper('peoplePickerDivLinMan', users, schema);

    }

    function onError(error) {
        alert("error");
    }
}
/**
*Check if user logged in is in Approbateurs group to show, or not, the field USER
*/
function CheckMemberInAdminGroup() {
    var clientContext = new SP.ClientContext.get_current();
    this.currentUser = clientContext.get_web().get_currentUser();
    clientContext.load(this.currentUser);

    window.userGroups = this.currentUser.get_groups();
    clientContext.load(window.userGroups);
    clientContext.executeQueryAsync(success, failure);
    function success() {
        var groupsEnumerator = userGroups.getEnumerator();
        while (groupsEnumerator.moveNext()) {
            var group = groupsEnumerator.get_current();
            if (group.get_title() == "Approbateurs") {
                $("#approverMember").show();
            }
        }
    }

    function failure() {
        // Something went wrong with the query
    }
}
/**
*Retrieve user ID
*@param {type} loginName - The login name of the user.
*/
function getUserId(loginName) {
    var context = new SP.ClientContext.get_current();
    this.user = context.get_web().ensureUser(loginName);
    context.load(this.user);
    context.executeQueryAsync(
         Function.createDelegate(null, ensureUserSuccess),
         Function.createDelegate(null, onFail)
    );
}
/**
*Query in Status List and filter by userId
*/
function ensureUserSuccess() {
    userId = this.user.get_id();

    var context = new SP.ClientContext.get_current();
    var oList = context.get_web().get_lists().getByTitle('StatusList');
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml('<View>' +
                            '<Query>' +
                                '<Where>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'AssignedTo\' LookupId=\'TRUE\'/>' +
                                                '<Value Type=\'User\'>' + userId + '</Value>' +
                                            '</Eq>' +
                                '</Where>' +
                            '<OrderBy>' +
                                '<FieldRef Name=\'Title\' Ascending=\'TRUE\' />' +
                                '</OrderBy>' +
                            '</Query>' +
                            '<ViewFields>' +
                                '<FieldRef Name=\'Id\' />' +
                                '<FieldRef Name=\'Month\' />' +
                                '<FieldRef Name=\'Year\' />' +
                                '<FieldRef Name=\'Total\' />' +
                                '<FieldRef Name=\'Status\' />' +
                            '</ViewFields>' +
                          '</View>');
    window.collListItem = oList.getItems(camlQuery);
    context.load(collListItem, 'Include(Id, Month, Year, Total, Status)');
    context.executeQueryAsync(Function.createDelegate(this, window.onQuerySucceededCreateItems),
    Function.createDelegate(this, window.onQueryFailed));



}
/**
*Get error message if something goes bad
 * @param {type} sender - The sender.
 * @param {type} args - The arguments.
*/
function onFail(sender, args) {
    alert('Query failed. Error: ' + args.get_message());
}
/**
*Check if exists something in statuslist for the month, year and user filtered
*/
function onQuerySucceededCreateItems() {
    var listEnumerator = collListItem.getEnumerator();
    var control = 0;
    while (listEnumerator.moveNext()) {
        var oListItem = listEnumerator.get_current();
        //Check if the Month And Year is Already in Draft Mode
        if (oListItem.get_item('Month') == monthSubmit && oListItem.get_item('Year') == yearSubmit) {
            control++;
        }
    }

    if (control == 0) {
        //getProjectInfo();
        var warning = "";
        warning = '<div class="alert alert-warning">' +
                       '<strong>Wait!</strong> Your form is being submitted...' +
                   '</div>';
        $("#warningMsg").html(warning);
        console.log(array);
        console.log(projectArray);
        updateStatusList(userId);
        updateExpenseSheet(userId);
    } else {
        var errorMes = '<div class="alert alert-danger">' +
                            '<strong>Atention!</strong> You have already one draft for ' + monthSubmit + ' ' + yearSubmit + '.' +
                        '</div>';
        submitClicked = true;

        $("#errorMsg").html(errorMes);
    }
}
/**
*Add new item in Status List
*/
function updateStatusList(user) {
    var assignedToVal = new SP.FieldUserValue();
    assignedToVal.set_lookupId(user);

    //update My Timesheet list
    var clientContext = new SP.ClientContext.get_current();

    var oList = clientContext.get_web().get_lists().getByTitle('StatusList');

    var itemCreateInfo = new SP.ListItemCreationInformation();
    this.oListItem = oList.addItem(itemCreateInfo);

    oListItem.set_item('Month', monthSubmit);
    oListItem.set_item('Year', yearSubmit);
    oListItem.set_item('Total', sumCol);
    oListItem.set_item('Status', "In Progress");
    oListItem.set_item('AssignedTo', assignedToVal);

    for (var i = 0; i < monthsInNumber.length; i++) {
        if (monthsInNumber[i][0] == monthSubmit) {
            oListItem.set_item('MonthNumber', monthsInNumber[i][1]);
        }
    }

    oListItem.update();

    clientContext.load(oListItem);

    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQueryCreateMyTimesheet), Function.createDelegate(this, this.onFail));

}
/**
*
*/
function onQueryCreateMyTimesheet() {
    // return to MyTimesheet
    attachFileToMyTimesheet(userId, monthSubmit, yearSubmit);
}
/**
*Add new item in Expense Sheet
*/
function updateExpenseSheet(user) {

    var assignedToVal = new SP.FieldUserValue();
    assignedToVal.set_lookupId(user);


    while (colCreated < count) {
        if (array[colCreated][14] != "Deleted") {

            var clientContext = new SP.ClientContext.get_current();

            //update Expense Sheet
            var oList = clientContext.get_web().get_lists().getByTitle('ExpenseSheet');

            var itemCreateInfo = new SP.ListItemCreationInformation();
            this.oListItem = oList.addItem(itemCreateInfo);

            for (var i = 0; i < projectArray.length; i++) {
                if (projectArray[i][1] == array[colCreated][1]) {
                    //already good to go
                    //oListItem.set_item('ProjectTitle', projectArray[i][2]);


                    //oListItem.set_item('PNum', projectInfo[colCreated][0]);
                    //oListItem.set_item('Amdt', projectInfo[colCreated][1]);
                    //oListItem.set_item('Cat', projectInfo[colCreated][3]);
                    //oListItem.set_item('FinalClient', projectInfo[colCreated][4]);
                    //oListItem.set_item('ProjectDetails', projectInfo[colCreated][5]);
                    //oListItem.set_item('Bench', projectInfo[colCreated][6]);
                }
            }
            
            
            oListItem.set_item('Project', array[colCreated][1]);
            dateRequest = new Date(array[colCreated][2].replace(/-/g, '\/'));
            oListItem.set_item('Date1', dateRequest);
            //oListItem.set_item('Date1', array[colCreated][2]);
            oListItem.set_item('Month', monthSubmit);
            oListItem.set_item('Year', yearSubmit);
            oListItem.set_item('Recipient', array[colCreated][3]);
            oListItem.set_item('Description1', array[colCreated][4]);
            oListItem.set_item('Province', array[colCreated][5]);
            oListItem.set_item('ExpensesType', array[colCreated][6]);
            oListItem.set_item('Amount', array[colCreated][7]);
            oListItem.set_item('Tip', array[colCreated][8]);
            oListItem.set_item('TPS', array[colCreated][9]);
            oListItem.set_item('TVQ', array[colCreated][10]);
            oListItem.set_item('Total', array[colCreated][11]);
            oListItem.set_item('ExchangeRate', array[colCreated][12]);
            oListItem.set_item('TotalAfterRate', array[colCreated][13]);
            oListItem.set_item('AssignedTo', assignedToVal);

            oListItem.update();

            clientContext.load(oListItem);

            clientContext.executeQueryAsync(Function.createDelegate(this, this.onQueryCreateSucceeded), Function.createDelegate(this, this.onFail));

            colCreated++;

        } else {
            colCreated++;
            onQueryCreateSucceeded();
        }
    }
}
/**
*If there's no more lines to add go to getLastItemId to add attachments
*/
function onQueryCreateSucceeded() {
    if (colCreated == count ) {
        getLastItemId(monthSubmit, yearSubmit,userId);
    }

}
/**
*Get Infos in Project List
*/
function lookupProject() {
    var ctx = new SP.ClientContext.get_current();
    //var siteUrl = 'https://siicanada.sharepoint.com/agency/direction/';
    var siteUrl = 'https://leonardotabosa.sharepoint.com/Direction/';
    var context = new SP.AppContextSite(ctx, siteUrl);
    ctx.load(context.get_web());
    var oList = context.get_web().get_lists().getByTitle('Project-List');
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml('<View>' +
                            '<Query>' +
                                '<Where>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'Status\'/>' +
                                                '<Value Type=\'Calculated\'>1-LAUNCHED</Value>' +
                                            '</Eq>' +
                                '</Where>' +
                                '<OrderBy>' +
                                    '<FieldRef Name=\'Final_x0020_Client\' Ascending=\'TRUE\' />' +
                                '</OrderBy>' +
                            '</Query>' +
                            '<ViewFields>' +
                                '<FieldRef Name=\'Id\' />' +
                                '<FieldRef Name=\'Title\' />' +
                                '<FieldRef Name=\'Cat\' />' +
                                '<FieldRef Name=\'Final_x0020_Client\' />' +
                                '<FieldRef Name=\'Details\' />' +
                                '<FieldRef Name=\'PNum\' />' +
                                '<FieldRef Name=\'Amdt0\' />' +
                                '<FieldRef Name=\'Bench\' />' +
                            '</ViewFields>' +
                          '</View>');
    window.collListItem = oList.getItems(camlQuery);
    ctx.load(collListItem, 'Include(Id, Title, Cat, Final_x0020_Client, Details, PNum, Amdt0, Bench)');
    ctx.executeQueryAsync(Function.createDelegate(this, window.onQueryLookupSucceeded),
    Function.createDelegate(this, window.onQueryFailed));

}
/**
*Get error message if something goes bad
 * @param {type} sender - The sender.
 * @param {type} args - The arguments.
*/
function onQueryFailed(sender, args) {
    SP.UI.Notify.addNotification('Request failed. ' + args.get_message() + '\n' +
    args.get_stackTrace(), true);
}
/**
 * On the query succeeded. Lists all the projects
 * @param {type} sender - The sender.
 * @param {type} args - The arguments.
 */
function onQueryLookupSucceeded(sender, args) {
    var listEnumerator = collListItem.getEnumerator();
    var countProjects = 0;
    while (listEnumerator.moveNext()) {
        var oListItem = listEnumerator.get_current();
        projectArray[countProjects] = new Array();
        projectArray[countProjects][0] = "<option value='" + oListItem.get_id() + "' label='" + oListItem.get_item('Final_x0020_Client').Label + " " + oListItem.get_item('Title') + " " + oListItem.get_item('PNum') + "-" + oListItem.get_item('Amdt0') + "'>" + oListItem.get_id() + "</option>";
        projectArray[countProjects][1] = oListItem.get_id();
        projectArray[countProjects][2] = oListItem.get_item('Title');
        projectArray[countProjects][3] = oListItem.get_item('Cat');
        projectArray[countProjects][4] = oListItem.get_item('Final_x0020_Client').Label;
        projectArray[countProjects][5] = oListItem.get_item('Details');
        projectArray[countProjects][6] = oListItem.get_item('PNum');
        projectArray[countProjects][7] = oListItem.get_item('Amdt0');
        projectArray[countProjects][8] = oListItem.get_item('Bench');
        countProjects++;
    }
    //console.log(projectArray);
    //$(".results").html(listInfo);
    //updateProjects();
    //holiday();

}
/**
*Update the total automatically
*/
function updateLineTotal() {
    if (count > 0) {
        sumCol = 0;
        for (var i = 0; i < count ; i++) {
            var sumLine = 0;

            for (var j = 7; j < 11; j++) {
                var temp = Number($('#col' + i + '-' + j).val());
                if (temp >= 0) {
                    sumLine += temp;
                    $('#col' + i + '-11').val(sumLine);
                } else if (!$('#col' + i + '-' + j).val() == "") {
                    $('#col' + i + '-' + j).val(0);
                }
            }
            if (array[i][14] != "Deleted") {
                sumCol += sumLine;
            }
        }
    }
    $('#totalHour').html(sumCol);
}
/**
*Add a new blank line
*/
function newLineOfProject() {
    var newLine = "";
    count++;
    for (var i = 0; i < count; i++) {
        newLine += '<tr id="row' + i + '">' +
                    '<td><input type="checkbox" id="col' + i + '-0"></td>' +
                    '<td><select class="form-control results" id="col' + i + '-1">';

        for (var j = 0; j < projectArray.length; j++) {
            newLine += projectArray[j][0];
        }

        newLine += '</select>' +
                    '</td>' +
                    '<td><input type="date"  id="col' + i + '-2" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-3" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-4" class="form-control"/></td>' +
                    '<td><select class="form-control" id="col' + i + '-5">' +
                            '<option value="BC" label="British Columbia" selected="selected">BC</option>' +
                            '<option value="NB" label="New Brunswick">NB</option>' +
                            '<option value="NS" label="Nova Scotia">NS</option>' +
                            '<option value="ON" label="Ontario">ON</option>' +
                            '<option value="QC" label="Quebec">QC</option>' +
                            '<option value="NL" label="Newfoundland and Labrador">NL</option>' +
                            '<option value="OP" label="Other Provinces">OP</option>' +
                            '<option value="OC" label="Outside Canada">OC</option>' +
                        '</select>' +
                    '</td>' +
                     '<td><select class="form-control" id="col' + i + '-6">' +
                            '<option>Accommodation expenses</option>' +
                            '<option>Airplane ticket</option>' +
                            '<option>Computer equipments</option>' +
                            '<option selected="selected">Direct expense</option>' +
                            '<option>Displacement</option>' +
                            '<option>For each day</option>' +
                            '<option>Kilometric allowance</option>' +
                            '<option>Office expenses</option>' +
                            '<option>Representation expenses</option>' +
                            '<option>Telephone consultant</option>' +
                            '<option>Telephone leader</option>' +
                        '</select>' +
                    '</td>' +
                    '<td><input type="number"  id="col' + i + '-7" class="form-control"/></td>' +
                    '<td><input type="number"  id="col' + i + '-8" class="form-control"/></td>' +
                    '<td><input type="number"  id="col' + i + '-9" class="form-control"/></td>' +
                    '<td><input type="number"  id="col' + i + '-10" class="form-control"/></td>' +
                    '<td><input type="text" value="" id="col' + i + '-11" class="form-control" readonly/></td>' +
                    '<td><input type="number"  id="col' + i + '-12" class="form-control"/></td>' +
                    '<td><input type="text" value="" id="col' + i + '-13" class="form-control" readonly/></td>' +
                    '<td><input type="hidden" id="col' + i + '-14"></td>' +
                  '</tr>';
    }
    fillArray();
    $("#newLine").html(newLine);
    updateProjects();
    //Update the total
    $(".form-control").focusout(function () {
        updateLineTotal();
    });

    //lookupProject();

}
/**
*Fill in the array with the line information
*/
function fillArray() {
    if (count != 0) {
        array[count - 1] = new Array(14);
        for (var i = 0; i < count; i++) {
            for (var j = 0; j < 15; j++) {
                array[i][j] = $('#col' + i + '-' + j).val();
            }
        }
    }
}
/**
*Update the old line with information from array
*/
function updateProjects() {
    if (count > 0) {
        for (var i = 0; i < count ; i++) {
            for (var j = 0; j < 15; j++) {
                $('#col' + i + '-' + j).val(array[i][j]);
            }
            if (array[i][14] == "Deleted") {
                $('#row' + i).hide();
            }
            if (array[i][5] == undefined || array[i][5] == null) {
                $('#col' + i + '-' + 5).val("BC");
            }
            if (array[i][6] == undefined || array[i][6] == null) {
                $('#col' + i + '-' + 6).val("Direct expense");
            }
            document.getElementById('col' + i + '-1').value = array[i][1];

            document.getElementById('col' + i + '-2').value = array[i][2];
        }
    }
}
/**
*Delete unwanted line
*/
function deleteLineOfProject() {
    for (var i = 0; i < count; i++) {
        if ($('#col' + i + '-0').is(':checked')) {
            $("#row" + i).hide();
            array[i][14] = "Deleted";
            $('#col' + i + '-' + 14).val("Deleted");
            updateLineTotal();
        }
    }
}