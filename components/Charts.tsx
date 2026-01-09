'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']

// Gráfico de evolução de pagamentos
export function EvolucaoPagamentosChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pagas" stroke="#10b981" strokeWidth={2} name="Pagas" />
        <Line type="monotone" dataKey="pendentes" stroke="#ef4444" strokeWidth={2} name="Pendentes" />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Gráfico de receita mensal
export function ReceitaMensalChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`} />
        <Legend />
        <Bar dataKey="recebido" fill="#10b981" name="Recebido" />
        <Bar dataKey="pendente" fill="#f59e0b" name="Pendente" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Gráfico de distribuição de status
export function StatusDistribuicaoChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Gráfico de comparação anual
export function ComparativoAnualChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="ano" />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`} />
        <Legend />
        <Bar dataKey="total" fill="#3b82f6" name="Total" />
        <Bar dataKey="recebido" fill="#10b981" name="Recebido" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Gráfico de funcionários por status
export function FuncionariosStatusChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={70} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Quantidade" />
      </BarChart>
    </ResponsiveContainer>
  )
}
