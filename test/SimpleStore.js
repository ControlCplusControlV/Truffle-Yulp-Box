const SimpleStorage = artifacts.require("SimpleStore")

contract("SimpleStore", (accounts) => {
	beforeEach(async () => {
	})
	it("Should Store a Vaule", async () => {
		let SimpleStore = await SimpleStorage.new()
		let storeValue = await SimpleStore.store(5);
		let StoredValue = await SimpleStore.get()
		console.log(StoredValue)
	})
})
