import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // !!! 这一行非常重要，请在这里替换为您的 MyTonWallet 测试网地址 !!!
    // 这个地址是您的 WXD 代币的“管理者”地址。
    // 您可以在 MyTonWallet 插件中找到您的测试网钱包地址，它通常以 `kQ` 开头。
    const ownerAddress = Address.parse(‘0QCOJkI_iWZBstZC9BnhjZ-6hbGGgl6TDJeRnDLKoZTrAFio’).address!;
    // 例如：如果您知道您的钱包地址是 'kQ...'，您可以这样写：
    // const ownerAddress = Address.parse('kQ...您的测试网钱包地址...');


    // !!! 替换为您的 WXD 代币元数据 JSON 文件的公开 URL !!!
    // 这个 URL 必须是公开可访问的，例如托管在 GitHub Pages 或 IPFS 上。
    // 元数据 JSON 文件包含了代币的名称 (WXD)、符号、精度 (decimals)、图片等信息。
    // 例如：https://[您的GitHub用户名].github.io/[您的仓库名]/wxd-metadata.json
    const jettonContentUri = "https://tfgfeifei.github.io/wxd-test/wxd-metadata.json"; // <-- **务必修改这里！现在可以先用 example.com 作为占位符，但部署前必须改！**


    // 构建 content cell，用于存储元数据 URI
    // Jetton 标准通常要求元数据 URI 以特定的方式编码到 cell 中
    const contentCell = provider.api().provider(Address.parse(ownerAddress.toString())).buildJettonContent(
        { type: 'offchain', uri: jettonContentUri }
    );


    // 创建 Jetton Minter 合约的实例
    const jettonMinter = provider.open(JettonMinter.createFromConfig({
        owner: ownerAddress,        // 代币管理者地址
        total_supply: 0,            // 初始总供应量为 0
        content: contentCell,       // 代币的元数据（包含名称、符号等）
        jetton_wallet_code: JettonMinter.jettonWalletCode, // 代币钱包的合约代码
    }, await JettonMinter.fromInit(ownerAddress, contentCell)));


    // 发送部署交易到 TON 区块链
    // toNano('0.05') 表示这次部署交易需要消耗 0.05 TON 作为 Gas 费。
    await jettonMinter.sendDeploy(provider.sender(), toNano('0.05'));

    // 等待合约部署到链上
    await provider.waitForDeploy(jettonMinter.address);

    // 在终端打印部署信息
    console.log('Jetton Minter deployed to:', jettonMinter.address.toString());
    console.log('Owner address:', ownerAddress.toString());
    console.log('Metadata URI:', jettonContentUri);
}