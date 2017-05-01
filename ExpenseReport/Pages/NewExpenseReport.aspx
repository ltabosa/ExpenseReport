<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <script type="text/javascript" src="../Scripts/jquery-3.1.1.min.js"></script>
    <SharePoint:ScriptLink Name="sp.js" runat="server" OnDemand="true" LoadAfterUI="true" Localizable="false" />

    <!-- JS used to make the SPService works with people picker -->
    <SharePoint:ScriptLink Name="clienttemplates.js" runat="server" LoadAfterUI="true" Localizable="false" />
    <SharePoint:ScriptLink Name="clientforms.js" runat="server" LoadAfterUI="true" Localizable="false" />
    <SharePoint:ScriptLink Name="clientpeoplepicker.js" runat="server" LoadAfterUI="true" Localizable="false" />
    <SharePoint:ScriptLink Name="autofill.js" runat="server" LoadAfterUI="true" Localizable="false" />
    <SharePoint:ScriptLink Name="sp.runtime.js" runat="server" LoadAfterUI="true" Localizable="false" />
    <SharePoint:ScriptLink Name="sp.core.js" runat="server" LoadAfterUI="true" Localizable="false" />

    <meta name="WebPartPageExpansion" content="full" />

    <!-- Ajoutez vos styles CSS au fichier suivant -->
    <link rel="Stylesheet" type="text/css" href="../Content/App.css" />
    <link rel="Stylesheet" type="text/css" href="../Content/bootstrap.min.css" />
    <link type="text/css" href="../Content/jquery-ui.css" rel="stylesheet" />

    <!-- Ajoutez votre code JavaScript au fichier suivant -->
    <script type="text/javascript" src="../Scripts/NewExpenseReport.js"></script>
    <script type="text/javascript" src="../Scripts/AddAttachmentFile.js"></script>
    <script type="text/javascript" src="../Scripts/bootstrap.min.js"></script>
    <script type="text/javascript" src="../Scripts/jquery-ui-1.12.1.min.js"></script>
    <script type="text/javascript" src="../Scripts/jquery.SPServices-2014.02.min.js"></script>
</asp:Content>

<%-- Le balisage de l'élément Content suivant sera placé dans la partie TitleArea de la page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    New Expense Report
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <br />
    <br />

    <div id="errorMsg"></div>
    <div id="warningMsg"></div>

    <form autocomplete="off">
        <div class="form-group row">
            <div class="col-xs-6">
                <a href="../Pages/Default.aspx" id="backBtn" class="btn btn-default " role="button">BACK</a>

                <input name="Submit" id="Submit" type="button" value="SAVE" class="btn btn-default btn-lg" />

            </div>
        </div>

        <div class="form-group row">
            <div class="col-xs-2">
                <label for="txtMonth">Month</label>
                <input type="text" name="txtMonth" id="txtMonth" class="date-picker-month form-control changeDate" onchange="numberOfDaysInMonth()" />
            </div>
        </div>
        <div class="form-group row">
            <div class="col-xs-2">
                <label for="txtYear">Year</label>
                <input type="text" name="txtFromYear" id="txtYear" class="date-picker-year form-control changeDate" />
            </div>
        </div>


        <div class="form-group row" id="approverMember">
            <div class="col-xs-2">
                <label for="SdfPeoplePicker">User</label>
                <div id="peoplePickerDivLinMan" title="User_"></div>
            </div>
        </div>

        <div class="form-group row">
            <div class="col-xs-2">
                <label for="customFileUploadControl">File input</label>
                <input id="customFileUploadControl" type="file" />
            </div>
        </div>

        <div class="container" id="myclass">

            <table class="form-group table-bordered table-reflow">
                <thead>
                    <tr>
                        <th></th>
                        <th class="col-xs-2">Project</th>
                        <th class="col-xs-1">Date</th>
                        <th class="projectTotal col-xs-2">Recipient</th>
                        <th class="col-xs-2">Description</th>
                        <th class="col-xs-1">Province</th>
                        <th class="col-xs-1">Expense Type</th>
                         <th class="Numbers">Amount $CAD</th>
                        <th  class="Numbers">Tip $CAD</th>
                        <th  class="Numbers">TPS $CAD</th>
                        <th  class="Numbers">TVQ $CAD</th>
                        <th  class="Numbers">Total $CAD</th>
                        <th class="col-xs-1">Used Exchange Rate > $CAD</th>
                        <th class="notShow">Total</th>
                        <th class="notShow"></th>
                    </tr>
                </thead>

                <tbody id="newLine"></tbody>
                <tbody id="msg"></tbody>
            </table>

            <p class=".col-md-8">New: <a href="#" id="otherExpense"><span class="glyphicon glyphicon-plus-sign"></span></a>/ Delete Selected Lines: <a href="#" id="deleteLine"><span class="glyphicon glyphicon glyphicon-minus-sign"></span></a></p>

        </div>
        <br />
        <p><strong>Total: <span id="totalHour">0</span></strong></p>
    </form>
    <br />
    <br />
</asp:Content>
