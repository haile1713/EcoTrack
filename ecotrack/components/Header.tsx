//@ts-nocheck

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Menu,
	Coins,
	Leaf,
	Search,
	Bell,
	User,
	ChevronDown,
	LogIn,
	LogOut,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
// import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
	createUser,
	markNotificationAsRead,
	getUserByEmail,
	getUserBalance,
	getUnreadnotifications,
} from "@/utils/db/actions";

import { useMediaQuery } from "@/hooks/useMediaQuery";

const clientId =
	"BJKdDFkNtkWX87XqkuWrDu4rbkSvWyQZ5lswS0ucINxxcN0inRVW8zzKAywPPzgiOHP7_3PcfFwfpvcQvSdaLRs";

const chainConfig = {
	chainNamespace: CHAIN_NAMESPACES.EIP155,
	chainId: "0xaa36a7",
	rpcTarget: "https://rpc.ankr.com/eth_sepolia",
	displayName: "Ethereum Sepolia Testnet",
	blockExplorerUrl: "https://sepolia.etherscan.io",
	ticker: "ETH",
	tickerName: "Ethereum",
	logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
	config: { chainConfig },
});

const web3auth = new Web3Auth({
	clientId,
	web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET, // Changed from SAPPHIRE_MAINNET to TESTNET
	privateKeyProvider,
});

interface HeaderProps {
	onMenuClick: () => void;
	totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
	const [provider, setProvider] = useState<IProvider | null>(null);
	const [loggedIn, setLoggedIn] = useState(false);
	const [loading, setLoading] = useState(true);
	const [userInfo, setUserInfo] = useState<any>(null);
	const pathname = usePathname();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [balance, setBalance] = useState(0);
	const isMobile = useMediaQuery("(max-width:768px)");

	console.log("user info", userInfo);

	useEffect(() => {
		const init = async () => {
			try {
				await web3auth.initModal();
				setProvider(web3auth.provider);

				if (web3auth.connected) {
					setLoggedIn(true);
					const user = await web3auth.getUserInfo();
					setUserInfo(user);
					if (user.email) {
						localStorage.setItem("userEmail", user.email);
						try {
							await createUser(
								user.email,
								user.name || "Anonymous User"
							);
						} catch (error) {
							console.error("Error creating user:", error);
							// Handle the error appropriately, maybe show a message to the user
						}
					}
				}
			} catch (error) {
				console.error("Error initializing Web3Auth:", error);
			} finally {
				setLoading(false);
			}
		};

		init();
	}, []);

	useEffect(() => {
		const fetchNotifications = async () => {
			if (userInfo && userInfo.email) {
				const user = await getUserByEmail(userInfo.email);
				if (user) {
					const unreadNotifications = await getUnreadnotifications(
						user.id
					);
					setNotifications(unreadNotifications);
				}
			}
		};

		fetchNotifications();

		// Set up periodic checking for new notifications
		const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds

		return () => clearInterval(notificationInterval);
	}, [userInfo]);

	useEffect(() => {
		const fetchUserBalance = async () => {
			if (userInfo && userInfo.email) {
				const user = await getUserByEmail(userInfo.email);
				if (user) {
					const userBalance = await getUserBalance(user.id);
					setBalance(userBalance);
				}
			}
		};

		fetchUserBalance();

		// Add an event listener for balance updates
		const handleBalanceUpdate = (event: CustomEvent) => {
			setBalance(event.detail);
		};

		window.addEventListener(
			"balanceUpdated",
			handleBalanceUpdate as EventListener
		);

		return () => {
			window.removeEventListener(
				"balanceUpdated",
				handleBalanceUpdate as EventListener
			);
		};
	}, [userInfo]);

	const login = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		try {
			const web3authProvider = await web3auth.connect();
			setProvider(web3authProvider);
			setLoggedIn(true);
			const user = await web3auth.getUserInfo();
			setUserInfo(user);
			if (user.email) {
				localStorage.setItem("userEmail", user.email);
				try {
					await createUser(user.email, user.name || "Anonymous User");
				} catch (error) {
					console.error("Error creating user:", error);
					// Handle the error appropriately, maybe show a message to the user
				}
			}
		} catch (error) {
			console.error("Error during login:", error);
		}
	};

	const logout = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		try {
			await web3auth.logout();
			setProvider(null);
			setLoggedIn(false);
			setUserInfo(null);
			localStorage.removeItem("userEmail");
		} catch (error) {
			console.error("Error during logout:", error);
		}
	};

	const getUserInfo = async () => {
		if (web3auth.connected) {
			const user = await web3auth.getUserInfo();
			setUserInfo(user);
			if (user.email) {
				localStorage.setItem("userEmail", user.email);
				try {
					await createUser(user.email, user.name || "Anonymous User");
				} catch (error) {
					console.error("Error creating user:", error);
					// Handle the error appropriately, maybe show a message to the user
				}
			}
		}
	};

	const handleNotificationClick = async (notificationId: number) => {
		await markNotificationAsRead(notificationId);
	};

	if (loading) {
		return <div>Loading Web3Auth...</div>;
	}

	return (
		<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
			<div>
				<div className="flex items-center justify-between px-4 py-2">
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							className="mr-2 md:mr-4"
							onClick={onMenuClick}
						>
							<Menu className="h-6 w-6 text-gray-800" />
						</Button>
						<Link href="/" className="flex items-center">
							<Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
							<div className="flex flex-col">
								<span className="font-bold text-base md:text-lg text-gray-800">
									Eco Track
								</span>
							</div>
						</Link>
					</div>
					{!isMobile && (
						<div className="flex-1 max-w-xl mx-4">
							<div className="relative">
								<input
									type="text"
									placeholder="Search"
									className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
								/>
								<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							</div>
						</div>
					)}
					<div className="flex items-center">
						{isMobile && (
							<Button variant="ghost" size="icon" className="mr-2">
								<Search className="h-5 w-5" />
							</Button>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="mr-2 realtive"
								>
									<Bell className="h-5 w-5 text-gray-800" />
									{notifications.length > 0 && (
										<Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
											{notifications.length}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64">
								{notifications.length > 0 ? (
									notifications.map((notifications: any) => (
										<DropdownMenuItem
											key={notifications.id}
											onClick={() =>
												handleNotificationClick(notifications.id)
											}
										>
											<div className="flex flex-col">
												<span className="font-medium">
													{notifications.type}
												</span>
												<span className="text-sm text-gray-500">
													{notifications.message}
												</span>
											</div>
										</DropdownMenuItem>
									))
								) : (
									<DropdownMenuItem>
										No new notfications
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						<div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
							<Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
							<span className="font-semibold text-sm md:text-base text-gray-800">
								{balance.toFixed(2)}
							</span>
						</div>
						{!loggedIn ? (
							<Button
								onClick={login}
								className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
							>
								Login
								<LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5" />
							</Button>
						) : (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="items-center flex"
									>
										<User className="h-5 w-5 mr-1" />
										<ChevronDown className="h-4 w-4 " />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={getUserInfo}>
										{userInfo ? userInfo.name : "Profile"}
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Link href={"/settings"}>Settings</Link>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={logout}>
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
