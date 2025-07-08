import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from '@ton/core';
import { crc32str } from '@ton/crypto';

// 定义 Jetton Minter 合约的配置类型
export type JettonMinterConfig = {
    owner: Address;
    total_supply: bigint;
    content: Cell;
    jetton_wallet_code: Cell;
};

// 将 Jetton Minter 配置转换为 Cell (TON 区块链数据结构)
export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell()
        .storeCoins(config.total_supply)
        .storeAddress(config.owner)
        .storeRef(config.content)
        .storeRef(config.jetton_wallet_code)
        .endCell();
}

// 定义一些操作码 (Opcodes)，用于识别不同的消息类型
export const Opcodes = {
    mint: 0x15, // 铸造操作码，只是一个示例，只要是唯一的即可
};

// JettonMinter 类，用于与合约交互
export class JettonMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    // 通过合约地址创建实例
    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    // 通过配置和合约代码创建实例 (用于部署时计算地址)
    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter(contractAddress(workchain, init), init);
    }

    // 发送部署交易
    async sendDeploy(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // 发送铸造消息给 Minter 合约
    async sendMint(provider: ContractProvider, sender: Sender, amount: bigint, receiver: Address, value: bigint) {
        const mintMessage = beginCell()
            .storeUint(crc32str("mint"), 32) // opcode for "mint"
            .storeCoins(amount)
            .storeAddress(receiver)
            .endCell();

        await provider.internal(sender, {
            value: value, // 附加 TON 用于 Gas
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: mintMessage,
        });
    }

    // 获取 Jetton 合约数据 (例如总供应量、所有者等)
    async getJettonData(provider: ContractProvider) {
        const result = (await provider.get('get_jetton_data', [])).stack;
        const totalSupply = result.readBigNumber();
        const mintable = result.readBoolean();
        const owner = result.readAddress();
        const content = result.readCell();
        const walletCode = result.readCell();
        return { totalSupply, mintable, owner, content, walletCode };
    }

    // 获取某个地址对应的 Jetton 钱包地址
    async getJettonWalletAddress(provider: ContractProvider, owner: Address) {
        const result = (await provider.get('get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }])).stack;
        return result.readAddress();
    }

    // --- Jetton Wallet Code ---
    // 这是一个辅助方法，用于提供 Jetton 钱包的合约代码。
    // 在完整的 Blueprint 项目中，Jetton 钱包代码通常是从单独的 .tact 文件编译而来。
    // 但为了简化您的手动设置，我们依赖于 Jetton Minter 合约的 init 函数来生成它。
    static get jettonWalletCode(): Cell {
        // 这里返回一个空的 Cell 作为占位符，因为实际的 Jetton Wallet 代码
        // 会在 JettonMinter 合约初始化时（通过您在 jetton-minter.tact 中粘贴的代码）被构建。
        // 只要它不为空，TypeScript 编译就能通过。
        return beginCell().endCell();
    }
}