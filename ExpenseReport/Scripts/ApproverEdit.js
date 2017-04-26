﻿$(document).ready(function () {

    //take month, year and user to collect data
    timesheetId = GetUrlKeyValue('ID', false);
    month = GetUrlKeyValue('Month', false);
    year = GetUrlKeyValue('Year', false);
    status = GetUrlKeyValue('Status', false);
    user = GetUrlKeyValue('User', false);
    userNameForUrl = user;
    projectInfo = new Array();
    projectCount = 0;
    sumCol = 0;
    count = 0;
    countLinesToDelete = 0;
    numberOfLinesInArray = 0;
    array = new Array();
    deleteLineArray = new Array();
    submitClicked = true;
    projectArray = new Array();

    //go back to beginning if take url without month and year 
    if (!month || !year) {
        window.location.href = 'ApproverView.aspx';
    }
    if (status == "InProgress") {
        var sucess = '<div class="alert alert-success">' +
                            '<strong>Sucess!</strong> The Expense for ' + userNameForUrl + ' in ' + month + ' ' + year + ' is approved.' +
                        '</div>';
        $("#sucessMsg").html(sucess);
    }

    //Show Month and Year In the Input
    $('#txtMonth').val(month);
    $('#txtYear').val(year);
    $('#txtUser').val(user);

    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', retrieveUserData);

    //otherProject
    $("#otherProject").click(function () {
        newLineOfProject();
    });

    //Delete Selected Lines
    $("#deleteLine").click(function () {
        deleteLineOfProject();
    });


    $("#Reject").click(function () {
        myTimesheetReject();
    });

    $("#Submit").click(function () {
        addFileToListMyTimesheet(timesheetId);

        //prevent multiple clicks
        if (submitClicked) {
            submitClicked = false;

            //update array with the newest info
            fillArray();

            var errorMes = "";

            for (var i = 0; i < count ; i++) {
                if (((array[i][1] == null) || (array[i][1] == undefined)) && (array[i][36] !== "Deleted")) {
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
                //if (i > 0) {
                //    for (var k = 0; k < i; k++) {
                //        if (((array[i][1] == array[k][1]) && (array[i][3] == array[k][3])) && (array[i][36] !== "Deleted")) {
                //            errorMes = '<div class="alert alert-danger">' +
                //                            '<strong>Atention!</strong> You already have this project and hour type.' +
                //                        '</div>';
                //            submitClicked = true;
                //        }
                //    }
                //}
            }
            if (sumCol == 0) {
                errorMes = '<div class="alert alert-danger">' +
                               '<strong>Atention!</strong> You can not send this project empty.' +
                           '</div>';
                submitClicked = true;
            }
            $("#errorMsg").html(errorMes);
            if (errorMes == "") {
                var warning = "";
                warning = '<div class="alert alert-warning">' +
                               '<strong>Wait!</strong> Your form is being submitted...' +
                           '</div>';
                $("#warningMsg").html(warning);
                //colCreated = 0;
                //getProjectInfo();
                console.log(array);
                console.log(projectArray);
            }
        }
    });
});
//*************************************************************************************
//                                   Load User Data
//*************************************************************************************

//Take the current number of rows in the specific month
//Change the Where to accept the month, year and current user for the request
function retrieveUserData() {
    //take user Id
    getUserId(user);
}
// Get the user ID.
function getUserId(loginName) {
    var context = new SP.ClientContext.get_current();
    this.user = context.get_web().ensureUser(loginName);
    context.load(this.user);
    context.executeQueryAsync(
         Function.createDelegate(null, ensureUserSuccess),
         Function.createDelegate(null, onFail)
    );
}

function ensureUserSuccess() {
    var userId = this.user.get_id();
    fillArrayAndTakeCount(userId);
}

function onFail(sender, args) {
    alert('Query failed. Error: ' + args.get_message());
}

function fillArrayAndTakeCount(userId) {
    //Take list info for the selected user
    var context = new SP.ClientContext.get_current();
    var oList = context.get_web().get_lists().getByTitle('ExpenseSheet');
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml('<View>' +
                            '<Query>' +
                                '<Where>' +
                                    '<And>' +
                                        '<And>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'Month\'/>' +
                                                '<Value Type=\'Text\'>' + month + '</Value>' +
                                            '</Eq>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'Year\'/>' +
                                                '<Value Type=\'Text\'>' + year + '</Value>' +
                                            '</Eq>' +
                                        '</And>' +
                                         '<Eq>' +
                                             '<FieldRef Name=\'AssignedTo\' LookupId=\'TRUE\'/>' +
                                             '<Value Type=\'User\'>' + userId + '</Value>' +
                                         '</Eq>' +
                                     '</And>' +
                                '</Where>' +
                                '<OrderBy>' +
                                    '<FieldRef Name=\'Title\' Ascending=\'TRUE\' />' +
                                '</OrderBy>' +
                            '</Query>' +
                            '<ViewFields>' +
                                '<FieldRef Name=\'Id\' />' +
                                '<FieldRef Name=\'Date1\' />' +
                                '<FieldRef Name=\'Recipient\' />' +
                                '<FieldRef Name=\'Month\' />' +
                                '<FieldRef Name=\'Year\' />' +
                                '<FieldRef Name=\'Description1\' />' +
                                '<FieldRef Name=\'Province\' />' +
                                '<FieldRef Name=\'ExpensesType\' />' +
                                '<FieldRef Name=\'Amount\' />' +
                                '<FieldRef Name=\'Tip\' />' +
                                '<FieldRef Name=\'TPS\' />' +
                                '<FieldRef Name=\'TVQ\' />' +
                                '<FieldRef Name=\'Total\' />' +
                                '<FieldRef Name=\'ExchangeRate\' />' +
                                '<FieldRef Name=\'TotalAfterRate\' />' +
                                '<FieldRef Name=\'Project\' />' +
                            '</ViewFields>' +
                          '</View>');
    window.collListItem = oList.getItems(camlQuery);
    context.load(collListItem, 'Include(Id, Project, Month, Year, Date1, Recipient, Description1, Province, ExpensesType, Amount, Tip, TPS, TVQ, Total, ExchangeRate, TotalAfterRate)');
    context.executeQueryAsync(Function.createDelegate(this, window.onQuerySucceeded),
    Function.createDelegate(this, window.onQueryFailed));
}

function onQueryFailed(sender, args) {
}

//take new count, fill array
function onQuerySucceeded(sender, args) {
    var listEnumerator = collListItem.getEnumerator();
    while (listEnumerator.moveNext()) {



        //update array
        var oListItem = listEnumerator.get_current();
        //save the number of lines to be deleted
        deleteLineArray[count] = oListItem.get_id();
        //count number of rows in list
        //count++;
        //var temp = count - 1;
        //var total = 0;
        array[count] = new Array(14);
        array[count][1] = oListItem.get_item('Project');
        array[count][2] = oListItem.get_item('Date1');
        array[count][3] = oListItem.get_item('Recipient');
        array[count][4] = oListItem.get_item('Description1');
        array[count][5] = oListItem.get_item('Province');
        array[count][6] = oListItem.get_item('ExpensesType');
        array[count][7] = oListItem.get_item('Amount');
        array[count][8] = oListItem.get_item('Tip');
        array[count][9] = oListItem.get_item('TPS');
        array[count][10] = oListItem.get_item('TVQ');
        array[count][11] = oListItem.get_item('Total');
        array[count][12] = oListItem.get_item('ExchangeRate');
        array[count][13] = oListItem.get_item('TotalAfterRate');

        //for (var j = 5; j < 36; j++) {
        //    array[temp][j] = oListItem.get_item('_x00' + (j - 4) + '_');
        //    total += array[temp][j];
        //}
        //array[temp][4] = total;
        //sumCol += total;

        sumCol += array[count][11];
        count++;

    }

    //Call this function to build the empty table.
    //newLineOfProject(count);
    //$('#totalHour').html(sumCol);
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', lookupProject);
}

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
    //SP.UI.Notify.addNotification('Request failed. ' + args.get_message() + '\n' +
    //args.get_stackTrace(), true);
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
    newLine(count);

    $('#totalHour').html(sumCol);

}

function newLine(rows) {
    var newLine = "";
    for (var i = 0; i < rows; i++) {
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
    $("#newLine").html(newLine);

    updateOldProjects();

    //Update the total
    $(".form-control").focusout(function () {
        updateLineTotal();
    });
}
/**
*Update the old line with information from array
*/
function updateOldProjects() {
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
            var d = new Date(array[i][2]);
            var dYear = d.getFullYear();
            var dMonth = d.getMonth() + 1;
            var dDay = d.getDate();
            dMonth = (dMonth < 10 ? '0' : '') + dMonth;

            document.getElementById('col' + i + '-2').value = dYear + "-" + dMonth + "-" + dDay;
        }
    }
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