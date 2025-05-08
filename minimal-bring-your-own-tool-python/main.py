import json
import os
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel, Field
from pydantic_core import from_json
import uvicorn
from starlette.responses import JSONResponse

app = FastAPI()
shopping_list: dict[str, int] = {}


class BaseRequest(BaseModel):
    tenantId: str
    agentId: str
    chatId: str
    toolId: str


class MetadataRequest(BaseRequest):
    pass


class CallbackRequest(BaseRequest):
    toolInput: str  # Json string of what the defined agent tool schema


class Config(BaseModel):
    name: str
    value: str


class ConfigChangedRequest(BaseRequest):
    config: List[Config]


class ResourceChangedRequest(ConfigChangedRequest):
    addedOrUpdatedResources: List[str]
    deletedResources: List[str]


class ShoppingListToolInput(BaseModel):
    itemName: str = Field(..., description='Name of the item that should be added to the shopping list')
    quantity: int = Field(1, description='Quantity of the item')


class ErrorDetails(BaseModel):
    message: str


class CustomErrorResponse(BaseModel):
    error: ErrorDetails


@app.get("/")
async def health():
    return {
        'status': 'ok',
    }


@app.post("/metadata")
async def on_metadata_fetched(req: MetadataRequest):
    print("Metadata fetched", json.dumps(req.dict()))

    return {
        'name': 'Generic Tool',
        'description': 'This tool performs various operations like hiring employees, training, notifying, and updating orders',
        'schema': json.dumps({})  # Empty schema as we're handling multiple functions
    }


@app.post("/callback")
async def on_tool_called(req: CallbackRequest):
    print("Callback called", json.dumps(req.dict()))

    tool_input = json.loads(req.toolInput)  # Parse the JSON string

    action = tool_input.get("action")
    params = tool_input.get("params", {})

    if action == "hire_employees":
        number = params.get("number")
        country = params.get("country")
        print(f"Hiring {number} employees in {country}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "train_employee":
        number = params.get("number")
        skill = params.get("skill")
        print(f"Training employee {number} with skill {skill}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "notify_supplier":
        supplier_id = params.get("SupplierID")
        message = params.get("Message")
        print(f"Notifying supplier {supplier_id}: {message}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "notify_customer":
        client_id = params.get("ClientID")
        message = params.get("Message")
        print(f"Notifying customer {client_id}: {message}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "update_order_quantity":
        order_id = params.get("OrderID")
        quantity = params.get("Quantity")
        print(f"Updating order {order_id} quantity to {quantity}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "update_order_date":
        order_id = params.get("OrderID")
        date = params.get("Date")
        print(f"Updating order {order_id} date to {date}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "update_order_shipper":
        order_id = params.get("OrderID")
        ship_via = params.get("ShipVia")
        print(f"Updating order {order_id} shipper to {ship_via}")
        return {"response": "200 success, transaction was successfully run"}

    elif action == "update_order_city":
        order_id = params.get("OrderID")
        city = params.get("City")
        print(f"Updating order {order_id} city to {city}")
        return {"response": "200 success, transaction was successfully run"}

    else:
        return {"response": "Unknown action"}


@app.post("/resourcesChanged")
async def on_resource_changed(req: ResourceChangedRequest):
    print("Resource changed, but we don't allow it", json.dumps(req.dict()))

    err = CustomErrorResponse(error=ErrorDetails(message="Example resource error"))
    return JSONResponse(status_code=400, content=err.dict())


@app.post("/configChanged")
async def on_config_changed(req: ConfigChangedRequest):
    print("Config changed, we ignore it", json.dumps(req.dict()))

    return {}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", log_level="info", port=int(os.environ.get('PORT', 8080)))