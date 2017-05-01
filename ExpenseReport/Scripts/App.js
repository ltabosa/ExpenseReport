/**
*Query to shows all projects
*/
$(document).ready(function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', retrieveExpenseByDate);

});
/**
 * Retrieves the DGD project.
 */
function retrieveExpenseByDate() {
    //Id of User logged in
    var userId = _spPageContextInfo.userId;

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
                                 '<FieldRef Name=\'Year\' Ascending=\'TRUE\' />' +
                                   '<FieldRef Name=\'MonthNumber\' Ascending=\'TRUE\' />' +
                                   '<FieldRef Name=\'Title\' Ascending=\'TRUE\' />' +
                                    '<FieldRef Name=\'AssignedTo\' Ascending=\'TRUE\' />' +
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
    context.executeQueryAsync(Function.createDelegate(this, window.onQuerySucceeded),
    Function.createDelegate(this, window.onQueryFailed));
}
/**
*On the query fail. Alert error message
**/
function onQueryFailed(sender, args) {
    SP.UI.Notify.addNotification('Request failed. ' + args.get_message() + '\n' +
    args.get_stackTrace(), true);
}
/**
 * On the query succeeded. Lists all the projects
 * @param {type} sender - The sender.
 * @param {type} args - The arguments.
 */
function onQuerySucceeded(sender, args) {
    var listEnumerator = collListItem.getEnumerator();

    var listInfo =
        "<table class='table table-striped'>" +
            "<tr>" +
                "<th class='col-md-1'></th>" +
                "<th class='col-md-1'>Year</th>" +
                "<th class='col-md-1'>Month</th>" +
                "<th class='text-right col-md-1'>Total</th>" +
                "<th class='col-md-1'>Status</th>" +
                 "<th class='col-md-1'></th>" +
                 "<th id='gridColumnAlign'></th>" +
            "</tr>";
    while (listEnumerator.moveNext()) {
        var oListItem = listEnumerator.get_current();
        var tempVal = oListItem.get_item('Total');
        tempVal = tempVal.toFixed(2);

        listInfo += "<tr>";

        listInfo += "<td class='col-md-1'><a href='EditExpenseReport.aspx?ID=" + oListItem.get_id() + "&Status=" + oListItem.get_item('Status') + "&Month=" + oListItem.get_item('Month') + "&Year=" + oListItem.get_item('Year') + "'><img src='../Images/EditIcon.png' /></a></td>";

        listInfo +=
          "<td>" + oListItem.get_item('Year') + "</td>" +
          "<td>" + oListItem.get_item('Month') + "</td>" +
           "<td class='text-right'>" + tempVal + " $CAD</td>" +
           "<td>" + oListItem.get_item('Status') + "</td>" +
           "<td id='attachment" + oListItem.get_id() + "'></td>" +
        "</tr>";
        getAttachments(oListItem.get_id());
    }
    listInfo += "</table>";
    $("#results").html(listInfo);
}
/**
*Add glyphicon if exists attachment file
*/
function getAttachments(itemId) {
    var attachmentFiles;
    var htmlAttachment = "<span class='glyphicon glyphicon-paperclip' aria-hidden='true'></span>";
    var ctx = new SP.ClientContext.get_current();
    var web = ctx.get_web();
    var attachmentFolder = web.getFolderByServerRelativeUrl('Lists/StatusList/Attachments/' + itemId);
    attachmentFiles = attachmentFolder.get_files();
    ctx.load(attachmentFiles);

    ctx.executeQueryAsync(function () {
        var i = 0;
        for (var file in attachmentFiles) {
            var attachmentUrl = attachmentFiles.itemAt(i).get_serverRelativeUrl();
            i++;
            $("#attachment" + itemId).html(htmlAttachment);
        }

    }, function () {
        //alert("sorry!");
    });
}