$(document).ready(function () {

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
    colCreated = 0;
    itCameFromNewExpenseReport = false;
    itCameFromEditExpenseReport = false;
    itCameFromApproverEdit = false;

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
        itCameFromApproverEdit = true;
        //addFileToListMyTimesheet(timesheetId);

        //prevent multiple clicks
        if (submitClicked) {
            submitClicked = false;

            //update array with the newest info
            fillArray();

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
                if (((array[i][3] == null) || (array[i][3] == "")) && (array[i][14] !== "Deleted")) {
                    errorMes += '<div class="alert alert-danger">' +
                            '<strong>Atention!</strong> Please fill the field <strong>Recipient</strong>.' +
                        '</div>';
                    submitClicked = true;

                }
                if (((array[i][4] == null) || (array[i][4] == "")) && (array[i][14] !== "Deleted")) {
                    errorMes += '<div class="alert alert-danger">' +
                            '<strong>Atention!</strong> Please fill the field <strong>Description</strong>.' +
                        '</div>';
                    submitClicked = true;

                }
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
                               '<strong>Wait!</strong> Your form is being submitted...<br/>It takes some time depending on the file size' +
                           '</div>';
                $("#warningMsg").html(warning);

                updateListMyTimesheet();
                updateExpenseSheet(user);
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
    //alert('Query failed. Error: ' + args.get_message());
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

        sumCol += array[count][11];
        count++;

    }

    //Call this function to build the empty table.
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', lookupProject);
}
//*************************************************************************************
//                                     Reject Clicked
//*************************************************************************************

function myTimesheetReject() {

    //update My Timesheet list
    var clientContext = new SP.ClientContext.get_current();

    var oList = clientContext.get_web().get_lists().getByTitle('StatusList');

    this.oListItem = oList.getItemById(timesheetId);

    oListItem.set_item('Status', "Rejected");


    oListItem.update();

    clientContext.load(oListItem);

    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQueryMyTimesheetReject), Function.createDelegate(this, this.onQueryCreateFailed));

}

function onQueryMyTimesheetReject() {

    window.location.href = '../Pages/ApproverView.aspx';
}

function updateListMyTimesheet() {
    //update My Timesheet list
    var clientContext = new SP.ClientContext.get_current();

    var oList = clientContext.get_web().get_lists().getByTitle('StatusList');

    this.oListItem = oList.getItemById(timesheetId);

    oListItem.set_item('Month', month);
    oListItem.set_item('Year', year);
    oListItem.set_item('Total', sumCol);
    oListItem.set_item('Status', "Approved");


    oListItem.update();

    clientContext.load(oListItem);

    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQueryCreateMyTimesheet), Function.createDelegate(this, this.onQueryCreateFailed));

}

function onQueryCreateMyTimesheet() {

}

function updateExpenseSheet(user) {

    var assignedToVal = new SP.FieldUserValue();
    assignedToVal.set_lookupId(user);

    while (colCreated < count) {
        if (array[colCreated][14] != "Deleted") {

            var clientContext = new SP.ClientContext.get_current();

            //update Timesheet List
            var oList = clientContext.get_web().get_lists().getByTitle('ExpenseSheet');

            var itemCreateInfo = new SP.ListItemCreationInformation();
            this.oListItem = oList.addItem(itemCreateInfo);

            for (var i = 0; i < projectArray.length; i++) {
                if (projectArray[i][1] == array[colCreated][1]) {
                    //already good to go
                    oListItem.set_item('ProjectTitle', projectArray[i][2]);
                    oListItem.set_item('Cat', projectArray[i][3]);
                    oListItem.set_item('FinalClient', projectArray[i][4]);
                    oListItem.set_item('ProjectDetails', projectArray[i][5]);
                    oListItem.set_item('PNum', projectArray[i][6]);
                    oListItem.set_item('Amdt', projectArray[i][7]);
                    oListItem.set_item('Department', projectArray[i][9]);
                    oListItem.set_item('InvoicedClient', projectArray[i][10]);
                }
            }

            oListItem.set_item('Project', array[colCreated][1]);
            dateRequest = new Date(array[colCreated][2].replace(/-/g, '\/'));
            oListItem.set_item('Date1', dateRequest);
            //oListItem.set_item('Date1', array[colCreated][2]);
            oListItem.set_item('Month', month);
            oListItem.set_item('Year', year);
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
            oListItem.set_item('AssignedTo', user);

            oListItem.update();

            clientContext.load(oListItem);

            clientContext.executeQueryAsync(Function.createDelegate(this, this.onQueryCreateSucceeded), Function.createDelegate(this, this.onQueryCreateFailed));
            colCreated++;

        } else {
            colCreated++;
            onQueryCreateSucceeded();
        }
    }
}
//same
function onQueryCreateSucceeded() {
    if (colCreated == count) {
        deleteOldListItems();
    }
}

function deleteOldListItems() {
    deleteLineArray.forEach(function (val) {

        this.itemId = val;

        var clientContext = new SP.ClientContext.get_current();
        var oList = clientContext.get_web().get_lists().getByTitle('ExpenseSheet');
        this.oListItem = oList.getItemById(itemId);

        oListItem.deleteObject();

        clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceededDeleted), Function.createDelegate(this, this.onQueryFailed));
    });
}

function onQuerySucceededDeleted() {
    var deleteline = deleteLineArray.length;
    countLinesToDelete++;
    if (countLinesToDelete == deleteline) {
        addFileToListMyTimesheet(timesheetId);
        //window.location.href = '../Pages/ApproverEdit.aspx?ID=' + timesheetId + '&Status=InProgress&User=' + userNameForUrl + '&Month=' + month + '&Year=' + year;
    }
}
