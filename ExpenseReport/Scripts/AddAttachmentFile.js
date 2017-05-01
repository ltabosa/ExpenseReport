'use strict';

ExecuteOrDelayUntilScriptLoaded(getWebProperties, "SP.js");//adicionar na pagina de edicao de timesheet


function attachFileToMyTimesheet(userId, monthSubmit, yearSubmit) {

    var context = new SP.ClientContext.get_current();
    var oList = context.get_web().get_lists().getByTitle('StatusList');
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml('<View>' +
                            '<Query>' +
                                '<Where>' +
                                    '<And>' +
                                        '<And>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'Month\'/>' +
                                                '<Value Type=\'Text\'>' + monthSubmit + '</Value>' +
                                            '</Eq>' +
                                            '<Eq>' +
                                                '<FieldRef Name=\'Year\'/>' +
                                                '<Value Type=\'Text\'>' + yearSubmit + '</Value>' +
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
                            '</ViewFields>' +
                          '</View>');
    window.collListItem = oList.getItems(camlQuery);
    context.load(collListItem, 'Include(Id)');
    context.executeQueryAsync(Function.createDelegate(this, window.onQuerySucceededAddFileToListMyTimesheet),
    Function.createDelegate(this, window.onQueryFailedToTakeId));
}
function onQueryFailedToTakeId(sender, args) {
    //alert('Query failed. Error: ' + args.get_message());
}
function onQuerySucceededAddFileToListMyTimesheet() {
    var listEnumerator = collListItem.getEnumerator();
    while (listEnumerator.moveNext()) {
        var oListItem = listEnumerator.get_current();
        var itemId = oListItem.get_id();
    }
    addFileToListMyTimesheet(itemId);
}

///******************************************************************************
function addFileToListMyTimesheet(itemId) {

    var listTitle = 'StatusList';
    //var itemId = 1;
    var fileInput = document.getElementById("customFileUploadControl");
    var file = fileInput.files[0];
    if (file != undefined) {
        processUpload(file, listTitle, itemId,
          function () {
              console.log('Attachment file has been uploaded');
              if (itCameFromNewExpenseReport) {
                  window.location.href = '../Pages/EditExpenseReport.aspx?ID=' + itemId + '&Status=InProgress&Month=' + monthSubmit + '&Year=' + yearSubmit + '';
              }else if (itCameFromApproverEdit) {
                  window.location.href = '../Pages/ApproverEdit.aspx?ID=' + timesheetId + '&Status=InProgress&User=' + userNameForUrl + '&Month=' + month + '&Year=' + year;
              } else if (itCameFromEditExpenseReport) {
                  window.location.href = '../Pages/EditExpenseReport.aspx?ID=' + timesheetId + '&Status=InProgress&Month=' + month + '&Year=' + year;
              }
          },
          function (sender, args) {
              console.log(args.get_message());
          });
    } else {
        if (itCameFromNewExpenseReport) {
            window.location.href = '../Pages/EditExpenseReport.aspx?ID=' + itemId + '&Status=InProgress&Month=' + monthSubmit + '&Year=' + yearSubmit + '';
        }else if (itCameFromApproverEdit) {
            window.location.href = '../Pages/ApproverEdit.aspx?ID=' + timesheetId + '&Status=InProgress&User=' + userNameForUrl + '&Month=' + month + '&Year=' + year;
        } else if (itCameFromEditExpenseReport) {
            window.location.href = '../Pages/EditExpenseReport.aspx?ID=' + timesheetId + '&Status=InProgress&Month=' + month + '&Year=' + year;
        }
    }
    function processUpload(fileInput, listTitle, itemId, success, error) {
        var reader = new FileReader();
        reader.onload = function (result) {
            var fileContent = new Uint8Array(result.target.result);
            performAttachmentUpload(listTitle, fileInput.name, itemId, fileContent, success, error);
        };
        reader.readAsArrayBuffer(fileInput);
    }

    function performAttachmentUpload(listTitle, fileName, itemId, fileContent, success, error) {

        ensureAttachmentFolder(listTitle, itemId,
           function (folder) {
               var attachmentFolderUrl = folder.get_serverRelativeUrl();
               uploadFile(attachmentFolderUrl, fileName, fileContent, success, error);
           },
           error);
    }

    function ensureAttachmentFolder(listTitle, itemId, success, error) {
        var ctx = SP.ClientContext.get_current();
        var web = ctx.get_web();
        var list = web.get_lists().getByTitle(listTitle);
        ctx.load(list, 'RootFolder');
        var item = list.getItemById(itemId);
        ctx.load(item);
        ctx.executeQueryAsync(
          function () {
              var attachmentsFolder;
              if (!item.get_fieldValues()['Attachments']) { /* Attachments folder exists? */
                  var attachmentRootFolderUrl = String.format('{0}/Attachments', list.get_rootFolder().get_serverRelativeUrl());
                  var attachmentsRootFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
                  //Note: Here is a tricky part. 
                  //Since SharePoint prevents the creation of folder with name that corresponds to item id, we are going to:   
                  //1)create a folder with name in the following format '_<itemid>'
                  //2)rename a folder from '_<itemid>'' into '<itemid>'
                  //This allow to bypass the limitation of creating attachment folders
                  var request;
                  if (window.XMLHttpRequest)
                      request = new XMLHttpRequest();
                  else
                      request = new ActiveXObject("Microsoft.XMLHTTP");
                  request.open('GET', attachmentRootFolderUrl + "/" + itemId, false);
                  request.send(); // there will be a 'pause' here until the response to come.
                  // the object request will be actually modified
                  if (request.status === 404) {
                      attachmentsFolder = attachmentsRootFolder.get_folders().add('_' + itemId);
                      attachmentsFolder.moveTo(attachmentRootFolderUrl + '/' + itemId);
                  } else {
                      var attachmentFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemId);
                      attachmentsFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentFolderUrl);
                  }
                  ctx.load(attachmentsFolder);
              }
              else {
                  var attachmentFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemId);
                  attachmentsFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentFolderUrl);
                  ctx.load(attachmentsFolder);
              }
              ctx.executeQueryAsync(
                   function () {
                       success(attachmentsFolder);
                   },
                   error);
          },
          error);
    }

    function uploadFile(folderUrl, fileName, fileContent, success, error) {
        var ctx = SP.ClientContext.get_current();
        var folder = ctx.get_web().getFolderByServerRelativeUrl(folderUrl);
        var encContent = new SP.Base64EncodedByteArray();
        for (var b = 0; b < fileContent.length; b++) {
            encContent.append(fileContent[b]);
        }
        var createInfo = new SP.FileCreationInformation();
        createInfo.set_content(encContent);
        createInfo.set_url(fileName);
        folder.get_files().add(createInfo);
        ctx.executeQueryAsync(success, error);
    }
    ///*******************************************************************************
}

function getWebProperties() {

    var attachmentFiles;
    if (timesheetId) {
        var itemId = timesheetId;
    } else itemId = null;
    var ctx = new SP.ClientContext.get_current();

    var web = ctx.get_web();
    var attachmentFolder = web.getFolderByServerRelativeUrl('Lists/StatusList/Attachments/' + itemId);
    attachmentFiles = attachmentFolder.get_files();
    ctx.load(attachmentFiles);

    ctx.executeQueryAsync(Function.createDelegate(this, onSuccess), Function.createDelegate(this, onFailed));

    function onSuccess(sender, args) {
        var i = 0;
        var html = "";
        var relativeUrl = "";
        for (var file in attachmentFiles) {
            $('#result').html(html);
            if (attachmentFiles.itemAt(i).get_serverRelativeUrl()) {
                relativeUrl = attachmentFiles.itemAt(i).get_serverRelativeUrl();
                var fileName = String(relativeUrl);
                fileName = fileName.split("/");
                fileName = fileName[7]; //sii site
                //fileName = fileName[6]; //personal site
                html += "<p><a href='" + relativeUrl + "'>" + fileName + "</a>";
                html += "<a onclick='deleteAttach(\"" + fileName + "\")' href='/'> Delete</a></p>";
            }
            i++;
        }
    }

    function onFailed(sender, args) {
        //alert("sorry!");
    }
}

function deleteAttach(fileName) {
    var listTitle = 'StatusList'
    var itemId = timesheetId;

    var ctx = SP.ClientContext.get_current();
    var list = ctx.get_web().get_lists().getByTitle(listTitle);
    var item = list.getItemById(itemId);
    var attachmentFile = item.get_attachmentFiles().getByFileName(fileName);
    attachmentFile.deleteObject();
    ctx.executeQueryAsync(
      function () {
          console.log('Attachment file has been deleted');
          location.reload();
      },
      function (sender, args) {
          console.log(args.get_message());
      });
}

//********************************************************************************************************
function getLastItemId(monthSubmit, yearSubmit, userId) {
    //var userId = _spPageContextInfo.userId;
    var caml = "<View><Query><Where>"
        + "<Eq><FieldRef Name='Author' LookupId='TRUE' /><Value Type='Integer'>"
        + userId + "</Value></Eq></Where>"
        + "<OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy>"
        + "</Query><RowLimit>1</RowLimit></View>";
    var ctx = SP.ClientContext.get_current()
    var web = ctx.get_web()
    var list = web.get_lists().getByTitle("StatusList")
    var query = new SP.CamlQuery();
    query.set_viewXml(caml);
    var items = list.getItems(query);
    ctx.load(items)
    ctx.executeQueryAsync(function () {
        // success actions
        var count = items.get_count();
        //should only be 1
        if (count > 1) {
            throw "Something is wrong. Should only be one latest list item / doc";
        }

        var enumerator = items.getEnumerator();
        enumerator.moveNext();
        var item = enumerator.get_current();
        var id = item.get_id();
        itCameFromNewExpenseReport = true;
        // do something with your result!!!!
        
        addFileToListMyTimesheet(id);

    }, function () {
        //failure handling comes here
    });
}


//************************************************************************************************************************************
//**************************************************COMMUM FUNCTIONS******************************************************************
//************************************************************************************************************************************

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
                    $('#col' + i + '-' + j).val("0.00");
                }
            }
            if (Number($('#col' + i + '-12').val()) >= 0) {

            } else if (!$('#col' + i + '-12').val() == "") {
                $('#col' + i + '-12').val(0);
            }
            if (array[i][14] != "Deleted") {
                sumCol += sumLine;
            }
            if ($('#col' + i + '-5').val() == "OC") {
                $('#col' + i + '-12').prop("readonly", false);
            } else {
                $('#col' + i + '-12').prop("readonly", true);
                $('#col' + i + '-12').val("");
            }
        }
    }
    var sumColTotal = sumCol.toFixed(2);
    $('#totalHour').html(sumColTotal + "$CAD");
}

/**
*Update the old line with information from array
*/
function updateProjects() {
    if (count > 0) {
        for (var i = 0; i < count ; i++) {
            for (var j = 0; j < 15; j++) {
                $('#col' + i + '-' + j).val(array[i][j]);
                if ((j > 6) && (j < 12)) {
                    var tempVal = Number(array[i][j]);
                    tempVal = tempVal.toFixed(2);
                    if (tempVal>=0){
                        $('#col' + i + '-' + j).val(tempVal);
                    }
                }
            }
            if (array[i][14] == "Deleted") {
                $('#row' + i).hide();
            }
            if (array[i][5] == undefined || array[i][5] == null) {
                $('#col' + i + '-' + 5).val("QC");
            }
            if (array[i][6] == undefined || array[i][6] == null) {
                $('#col' + i + '-' + 6).val("Direct expense");
            }
            if ($('#col' + i + '-5').val() == "OC") {
                $('#col' + i + '-12').prop("readonly", false);
            } else {
                $('#col' + i + '-12').prop("readonly", true);
                $('#col' + i + '-12').val("");
            }
            document.getElementById('col' + i + '-1').value = array[i][1];

            document.getElementById('col' + i + '-2').value = array[i][2];
        }
    }
}
/**
*Update the old line with information from array
*/
function updateOldProjects() {
    if (count > 0) {
        for (var i = 0; i < count ; i++) {
            for (var j = 0; j < 15; j++) {
                $('#col' + i + '-' + j).val(array[i][j]);
                if ((j > 6) && (j < 12)) {
                    var tempVal = Number(array[i][j]);
                    tempVal = tempVal.toFixed(2);
                    if (tempVal >= 0) {
                        $('#col' + i + '-' + j).val(tempVal);
                    }
                }
            }
            if (array[i][14] == "Deleted") {
                $('#row' + i).hide();
            }
            if (array[i][5] == undefined || array[i][5] == null) {
                $('#col' + i + '-' + 5).val("QC");
            }
            if (array[i][6] == undefined || array[i][6] == null) {
                $('#col' + i + '-' + 6).val("Direct expense");
            }
            if ($('#col' + i + '-5').val() == "OC") {
                $('#col' + i + '-12').prop("readonly", false);
            } else {
                $('#col' + i + '-12').prop("readonly", true);
                $('#col' + i + '-12').val("");
            }
            document.getElementById('col' + i + '-1').value = array[i][1];
            var d = new Date(array[i][2]);
            var dYear = d.getFullYear();
            var dMonth = d.getMonth() + 1;
            var dDay = d.getDate();

            dMonth = (dMonth < 10 ? '0' : '') + dMonth;
            dDay = (dDay < 10 ? '0' : '') + dDay;

            document.getElementById('col' + i + '-2').value = dYear + "-" + dMonth + "-" + dDay;
        }
    }
}

/**
*Get Infos in Project List
*/
function lookupProject() {
    var ctx = new SP.ClientContext.get_current();
    var siteUrl = 'https://siicanada.sharepoint.com/agency/direction/';
    //var siteUrl = 'https://leonardotabosa.sharepoint.com/Direction/';
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
                                '<FieldRef Name=\'Invoiced_x0020_Client\' />' +
                                '<FieldRef Name=\'Department\' />' +
                            '</ViewFields>' +
                          '</View>');
    window.collListItem = oList.getItems(camlQuery);
    ctx.load(collListItem, 'Include(Id, Title, Cat, Final_x0020_Client, Details, PNum, Amdt0, Bench, Invoiced_x0020_Client, Department)');
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
        projectArray[countProjects][9] = oListItem.get_item('Department');
        projectArray[countProjects][10] = oListItem.get_item('Invoiced_x0020_Client').Label;
        //projectArray[countProjects][10] = oListItem.get_item('Invoiced_x0020_Client');

        countProjects++;
    }
    newLine(count);

    var sumColTotal = sumCol.toFixed(2);
    $('#totalHour').html(sumColTotal + "$CAD");
    //console.log(projectArray);
    //$(".results").html(listInfo);
    //updateProjects();
    //holiday();

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
                            '<option value="BC" label="British Columbia" >BC</option>' +
                            '<option value="NB" label="New Brunswick">NB</option>' +
                            '<option value="NS" label="Nova Scotia">NS</option>' +
                            '<option value="ON" label="Ontario">ON</option>' +
                            '<option value="QC" label="Quebec" selected="selected">QC</option>' +
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
                    '<td><input type="text"  id="col' + i + '-7" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-8" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-9" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-10" class="form-control"/></td>' +
                    '<td><input type="text" value="" id="col' + i + '-11" class="form-control" readonly/></td>' +
                    '<td><input type="text"  id="col' + i + '-12" class="form-control" readonly/></td>' +
                    '<td><input type="hidden" value="" id="col' + i + '-13" class="form-control" readonly/></td>' +
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
                            '<option value="BC" label="British Columbia" >BC</option>' +
                            '<option value="NB" label="New Brunswick">NB</option>' +
                            '<option value="NS" label="Nova Scotia">NS</option>' +
                            '<option value="ON" label="Ontario">ON</option>' +
                            '<option value="QC" label="Quebec" selected="selected">QC</option>' +
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
                    '<td><input type="text"  id="col' + i + '-7" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-8" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-9" class="form-control"/></td>' +
                    '<td><input type="text"  id="col' + i + '-10" class="form-control"/></td>' +
                    '<td><input type="text" value="" id="col' + i + '-11" class="form-control" readonly/></td>' +
                    '<td><input type="text"  id="col' + i + '-12" class="form-control" readonly/></td>' +
                    '<td><input type="hidden" value="" id="col' + i + '-13" class="form-control" readonly/></td>' +
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
