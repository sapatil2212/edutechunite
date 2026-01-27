'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  History,
  ArrowUpRight
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
}

const MOCK_FEES = [
  {
    id: '1',
    title: 'Tuition Fee - Term 1',
    amount: 1500,
    dueDate: '2026-02-15',
    status: 'PAID',
    paidAt: '2026-01-10',
    type: 'Academic'
  },
  {
    id: '2',
    title: 'Laboratory Fee',
    amount: 200,
    dueDate: '2026-02-15',
    status: 'PENDING',
    paidAt: null,
    type: 'Facility'
  },
  {
    id: '3',
    title: 'Library Membership',
    amount: 50,
    dueDate: '2026-03-01',
    status: 'PENDING',
    paidAt: null,
    type: 'Resource'
  },
  {
    id: '4',
    title: 'Transport Fee - Feb',
    amount: 120,
    dueDate: '2026-02-05',
    status: 'OVERDUE',
    paidAt: null,
    type: 'Transport'
  }
]

export default function ParentFeesPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/institution/parent/children')
        const result = await res.json()
        if (result.children?.length > 0) {
          setChildren(result.children)
          setSelectedChild(result.children[0].id)
        }
      } catch (error) {
        console.error('Error fetching children:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  const totalFees = MOCK_FEES.reduce((acc, fee) => acc + fee.amount, 0)
  const paidFees = MOCK_FEES.filter(f => f.status === 'PAID').reduce((acc, fee) => acc + fee.amount, 0)
  const pendingFees = MOCK_FEES.filter(f => f.status !== 'PAID').reduce((acc, fee) => acc + fee.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and pay school fees for your children</p>
        </div>

        {children.length > 1 && (
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  selectedChild === child.id
                    ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {child.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedChild && loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Payable"
              value={`$${totalFees}`}
              change="Annual total"
              trend="up"
              icon={DollarSign}
              color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Paid Amount"
              value={`$${paidFees}`}
              change="To date"
              trend="up"
              icon={CheckCircle2}
              color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Pending Balance"
              value={`$${pendingFees}`}
              change="Immediate attention"
              trend="down"
              icon={Clock}
              color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            />
            <StatCard
              title="Next Due Date"
              value="Feb 15"
              change="Coming soon"
              trend="up"
              icon={CreditCard}
              color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-green-600" />
                  Fee Breakdown
                </CardTitle>
                <Badge variant="secondary" className="font-bold">2025-26 Session</Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-900/50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Description</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                    {MOCK_FEES.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{fee.title}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{fee.type}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white text-sm">
                          ${fee.amount}
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={
                            fee.status === 'PAID' ? 'success' :
                            fee.status === 'OVERDUE' ? 'danger' : 'warning'
                          } className="font-bold">
                            {fee.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {fee.status === 'PAID' ? (
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all">
                              <Download className="w-4 h-4" />
                            </button>
                          ) : (
                            <button className="flex items-center gap-1.5 ml-auto px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-sm">
                              Pay Now
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-soft p-6 bg-gradient-to-br from-green-600 to-teal-700 text-white">
                <h3 className="text-lg font-bold mb-2">Quick Pay</h3>
                <p className="text-sm text-green-100 mb-6">Settle all outstanding balances securely using your preferred payment method.</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/20 pb-4">
                    <span className="text-sm font-medium opacity-80">Pending Amount</span>
                    <span className="text-3xl font-black">${pendingFees}</span>
                  </div>
                  <button className="w-full py-4 bg-white text-green-700 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              </Card>

              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                  <CardTitle className="text-sm font-bold uppercase text-gray-500">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Late fees may apply for payments made after the due date.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
