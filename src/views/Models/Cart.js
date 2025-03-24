

module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = (item, qty, platform) => {  // 添加 platform 参数
        let record = this.items[item.id];
        if (!record) {
            const newRec = new Record(item, qty);
            newRec.platform = platform;  // 存储 platform
            this.items[item.id] = newRec;
        } else {
            this.items[item.id].qty += qty;
        }
        this.totalQty += qty;
        const price = item.price_promotion !== null ? item.price_promotion : item.price;
        this.totalPrice += (price * qty);
    };

    this.remove = (id) => {
        let record = this.items[id];
        if (record) {
            const removedQty = Number(record.qty);
            const price = record.item.price_promotion !== null ? record.item.price_promotion : record.item.price;
            this.totalQty -= removedQty;
            this.totalPrice -= (price * removedQty);
            delete this.items[id];
        }
    };

    this.set = (newItems) => {
        this.items = newItems;
        this.reloadCart();
    };

    this.reloadCart = () => {
        let newTotalQty = 0;
        let newTotalPrice = 0;
        for (let id in this.items) {
            const record = this.items[id];
            newTotalQty += record.qty;
            const price = record.item.price_promotion !== null ? record.item.price_promotion : record.item.price;
            newTotalPrice += (record.qty * price);
        }
        this.totalQty = newTotalQty;
        this.totalPrice = newTotalPrice;
    };

    this.toArray = () => {
        return Object.values(this.items);
    };
};