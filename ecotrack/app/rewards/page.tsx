"use client";
import { useState, useEffect } from "react";
import {
	Coins,
	ArrowUpRight,
	ArrowDownRight,
	Gift,
	AlertCircle,
	Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "react-hot-toast";
import {
	getAvailableRewards,
	getRewardTransactions,
	getUserByEmail,
} from "@/utils/db/actions";

type Transaction = {
	id: number;
	type: "earned_report" | "earned_collect" | "redeemed";
	amount: number;
	description: string;
	date: string;
};
type Reward = {
	id: number;
	name: string;
	cost: number;
	description: string | null;
	collectionInfo: string;
};

export default function RewardsPage() {
	const [user, setUser] = useState<{
		id: number;
		email: string;
		name: string;
	} | null>(null);
	const [balance, setBalance] = useState(0);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [rewards, setRewards] = useState<Reward[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserDataAndReward = async () => {
			setLoading(true);
			try {
				const userEmail = localStorage.getItem("userEmail");
				if (userEmail) {
					const fetchedUser = await getUserByEmail(userEmail);
					if (fetchedUser) {
						setUser(fetchedUser);
						const fetchedTransactions = await getRewardTransactions(
							fetchedUser.id
						);

						// Only proceed if fetchedTransactions is not null
						if (fetchedTransactions) {
							setTransactions(fetchedTransactions as Transaction[]);

							// Calculate the balance based on fetched transactions
							const calculatedBalance = fetchedTransactions.reduce(
								(acc: any, transaction: any) => {
									return transaction.type.startsWith("earned")
										? acc + transaction.amount
										: acc - transaction.amount;
								},
								0
							);
							setBalance(Math.max(calculatedBalance, 0)); // Ensure balance is never negative
						} else {
							setTransactions([]); // If transactions are null, set it to an empty array
						}

						// Fetch rewards safely
						const fetchedRewards = await getAvailableRewards(
							fetchedUser.id
						);
						setRewards(fetchedRewards || []); // Handle null case for rewards
					} else {
						toast.error("User not found. Please log in again.");
					}
				} else {
					toast.error("User not logged in. Please log in.");
				}
			} catch (error) {
				console.error("Error fetching user data and rewards:", error);
				toast.error("Failed to load rewards data. Please try again.");
			} finally {
				setLoading(false);
			}
		};
		fetchUserDataAndReward();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader className="animate-spin h-8 w-8 text-gray-600" />
			</div>
		);
	}
    return (
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6 text-gray-800">Rewards</h1>
          
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full border-l-4 border-green-500 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Reward Balance</h2>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center">
                <Coins className="w-10 h-10 mr-3 text-green-500" />
                <div>
                  <span className="text-4xl font-bold text-green-500">{balance}</span>
                  <p className="text-sm text-gray-500">Available Points</p>
                </div>
              </div>
            </div>
          </div>
    
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Transactions</h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {transactions.length > 0 ? (
                  transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center">
                        {transaction.type === 'earned_report' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500 mr-3" />
                        ) : transaction.type === 'earned_collect' ? (
                          <ArrowUpRight className="w-5 h-5 text-blue-500 mr-3" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-500 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${transaction.type.startsWith('earned') ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type.startsWith('earned') ? '+' : '-'}{transaction.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">No transactions yet</div>
                )}
              </div>
            </div>
    
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Available Rewards</h2>
              <div className="space-y-4">
                {rewards.length > 0 ? (
                  rewards.map(reward => (
                    <div key={reward.id} className="bg-white p-4 rounded-xl shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{reward.name}</h3>
                        <span className="text-green-500 font-semibold">{reward.cost} points</span>
                      </div>
                      <p className="text-gray-600 mb-2">{reward.description}</p>
                      <p className="text-sm text-gray-500 mb-4">{reward.collectionInfo}</p>
                      {reward.id === 0 ? (
                        <div className="space-y-2">
                          <Button 
                            // onClick={handleRedeemAllPoints}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                            disabled={balance === 0}
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Redeem All Points
                          </Button>
                        </div>
                      ) : (
                        <Button 
                        //   onClick={() => handleRedeemReward(reward.id)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                          disabled={balance < reward.cost}
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Redeem Reward
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-6 w-6 text-yellow-400 mr-3" />
                      <p className="text-yellow-700">No rewards available at the moment.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
}
