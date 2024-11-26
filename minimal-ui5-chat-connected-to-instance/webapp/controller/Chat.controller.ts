import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import MessageToast from "sap/m/MessageToast";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import UIComponent from "sap/ui/core/UIComponent";
import Control from "sap/ui/core/Control";
import ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";

export default class Chat extends Controller {
    private oDataModel: ODataModel;
    private selectionModel: JSONModel;
    private agentId: string;
    private chatId: string;


    onInit(): void {
        this.oDataModel = this.getOwnerComponent()?.getModel() as ODataModel;
        this.selectionModel = new JSONModel({ selectedChat: null });

        this.getView()?.setModel(this.selectionModel, "selectionModel");

        const oRouter = (this.getOwnerComponent() as UIComponent).getRouter();
        oRouter.getRoute("chat")?.attachPatternMatched(this._onPatternMatched, this);
    }

    private _onPatternMatched(oEvent: any): void {
        this.agentId = oEvent.getParameter("arguments").agentId;
        this.chatId = oEvent.getParameter("arguments").chatId;

        console.log("Agent ID from route:", this.agentId);
        console.log("Chat ID from route:", this.chatId);

        this._loadChatData();
    }

    private _loadChatData(): void {
        const sPath = `/Agents(${this.agentId})/chats(${this.chatId})/history`;
        const parameters = {
            $orderby: "createdAt"
        }
        this.oDataModel.bindList(sPath, undefined, undefined, undefined, parameters).requestContexts().then((aContexts: any) => {
            const aHistory = aContexts.map((oContext: any) => oContext.getObject());
            const oSelectedChat = {
                ID: this.chatId,
                history: aHistory
            };
            this.selectionModel.setProperty("/selectedChat", oSelectedChat);
        }).catch((oError: any) => {
            console.error("Error fetching chat history:", oError);
        });
    }

    onSendMessage(): void {
        const messageInput = this.getView()?.byId("messageInput") as Input;
        const sMessageContent = messageInput ? messageInput.getValue() : "";
        if (!sMessageContent) {
            MessageToast.show("Please enter a message.");
            return;
        }

        (this.byId('messageInput') as Control).setBusy(true);

        const oNewMessage = {
            ID: `${Date.now()}`,
            sender: "user",
            content: sMessageContent,
            createdAt: new Date().toISOString()
        };

        try {
            const action = this.getView()?.getModel()?.bindContext(`/Agents(${this.agentId})/chats(${this.chatId})/UnifiedAiAgentService.sendMessage(...)`) as ODataContextBinding;

            const oSelectedChat = this.selectionModel.getProperty("/selectedChat");
            oSelectedChat.history.push(oNewMessage);
            this.selectionModel.setProperty("/selectedChat/history", oSelectedChat.history);

            action.setParameter("msg", sMessageContent)
                .setParameter("async", false)
                .invoke()
                .then(() => {
                    // Update chat history upon successful send


                    // Clear the input field
                    if (messageInput) {
                        messageInput.setValue("");
                    }

                    this._loadChatData();
                })
                .catch((error: any) => {
                    console.error("Error sending message:", error);
                    MessageToast.show("Failed to send the message.");
                })
                .finally(() => {
                    // Hide loading indication
                    (this.byId('messageInput') as Control).setBusy(false);
                });
        } catch (error) {
            console.error("Error setting up message send:", error);
            (this.byId('messageInput') as Control).setBusy(false);
        }
    }


    onNavBack(): void {
        const oComponent = this.getOwnerComponent();
        (oComponent as any).getRouter().navTo("chatPicker");
    }
}
